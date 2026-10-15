import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

test('document upload, exam scheduling and oral answers persist through real SQL-backed APIs', async ({ page, request }) => {
  test.skip(!process.env.TEST_USERNAME || !process.env.TEST_PASSWORD, 'Requires temporary admin credentials and scoped SQL cleanup.');
  const stamp = Date.now(), password = 'OralPassword123!';
  const fixture = { students: [], subjectId: null }; mkdirSync('test-results', { recursive: true });
  let admin, examId;
  const local = milliseconds => new Date(milliseconds + 7 * 3600000).toISOString().slice(0,19);
  async function api(method, path, data, token = admin) {
    const response = await request.fetch(`/api${path}`, { method, headers: token ? { Authorization: `Bearer ${token}` } : {}, ...(data ? { data } : {}) });
    expect(response.ok(), await response.text()).toBe(true); return response.status() === 204 ? null : response.json();
  }
  async function login(username, loginPassword) {
    await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(loginPassword);
    await page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  }
  try {
    admin = (await api('POST','/auth/login',{ username: process.env.TEST_USERNAME, password: process.env.TEST_PASSWORD },null)).token;
    fixture.subjectId = (await api('POST','/subjects',{ subjectCode:`ORAL_${stamp}`,subjectName:'Oral integration course' })).subjectId;
    for (let i=1;i<=2;i++) fixture.students.push((await api('POST','/users',{ username:`oral_${stamp}_${i}`,password,fullName:`Oral Student ${i}`,email:`oral_${stamp}_${i}@aives.local`,role:'STUDENT' })).userId);
    await page.goto('/'); await login(process.env.TEST_USERNAME,process.env.TEST_PASSWORD);
    await page.getByRole('button',{ name:'Tài liệu học tập',exact:true }).click();
    await page.getByLabel('Môn học',{exact:true}).selectOption(String(fixture.subjectId));
    await page.getByLabel('Tên tài liệu',{exact:true}).fill(`Notes ${stamp}`);
    await page.locator('input[type=file]').setInputFiles({ name:'lecture.txt',mimeType:'text/plain',buffer:Buffer.from('Dependency inversion keeps domain code independent of infrastructure. SOLID improves maintainability.') });
    const uploaded=page.waitForResponse(r => r.url().endsWith('/api/documents') && r.request().method()==='POST');
    await page.getByRole('button',{name:'Tải lên và lập chỉ mục',exact:true}).click();
    const document=await (await uploaded).json(); expect(document.status).toBe('INDEXED');
    await expect(page.getByText(`Notes ${stamp}`,{exact:true})).toBeVisible();
    const qids=[];
    for(let i=1;i<=2;i++) {
      const q=await api('POST','/questions',{subjectId:fixture.subjectId,documentId:document.documentId,questionContent:`Explain dependency inversion example ${i}`,bloomLevel:'UNDERSTAND'});
      qids.push(q.questionId);
      await api('POST',`/questions/${q.questionId}/rubrics`,{criteriaName:'Correct explanation',maxScore:10,guideline:'Explain dependencies pointing toward domain.'});
      await api('POST',`/questions/${q.questionId}/review`,{status:'APPROVED'});
    }
    await page.getByRole('button',{name:'Ca thi vấn đáp',exact:true}).click();
    await page.getByRole('button',{name:'Thêm',exact:true}).click();
    const form=page.getByRole('dialog',{name:'Thêm Kỳ thi'});
    await form.getByLabel('Môn học',{exact:true}).selectOption(String(fixture.subjectId));
    await form.getByLabel('Tên kỳ thi').fill(`Oral ${stamp}`);
    await form.getByLabel('Bắt đầu',{exact:true}).fill(local(Date.now()-10*60000));
    await form.getByLabel('Kết thúc',{exact:true}).fill(local(Date.now()+3600000));
    await form.getByLabel('Số câu chính').fill('1');
    await form.getByLabel('Hỏi thêm tối đa mỗi câu chính').fill('0');
    await form.getByLabel('Thời gian mỗi câu (giây)').fill('120');
    const saved=page.waitForResponse(r => r.url().endsWith('/api/exams') && r.request().method()==='POST');
    await form.getByRole('button',{name:'Lưu',exact:true}).click();
    const savedResponse=await saved; expect(savedResponse.ok()).toBe(true); examId=(await savedResponse.json()).examId;
    const row=page.getByRole('row').filter({hasText:`Oral ${stamp}`});
    await row.getByRole('button',{name:'Lịch thi & transcript'}).click();
    const schedules=page.getByRole('dialog',{name:'Lịch thi & transcript'});
    await schedules.getByRole('button',{name:'Thêm',exact:true}).click();
    const slot=page.getByRole('dialog',{name:`Thêm Oral ${stamp}`});
    await slot.getByLabel('Sinh viên').selectOption(String(fixture.students[0]));
    await slot.getByLabel('Bắt đầu lượt thi').fill(local(Date.now()-60000));
    await slot.getByLabel('Kết thúc lượt thi').fill(local(Date.now()+1800000));
    const slotResponse=page.waitForResponse(r => r.url().endsWith(`/api/exams/${examId}/schedules`) && r.request().method()==='POST');
    await slot.getByRole('button',{name:'Lưu',exact:true}).click();
    const first=(await (await slotResponse).json()).scheduleId;
    const second=(await api('POST',`/exams/${examId}/schedules`,{studentId:fixture.students[1],allocatedStartTime:local(Date.now()-60000),allocatedEndTime:local(Date.now()+1800000)})).scheduleId;
    await schedules.getByRole('button',{name:'Đóng',exact:true}).click();
    await row.getByRole('button',{name:'Xuất bản',exact:true}).click();
    await expect(row).toContainText('PUBLISHED');
    await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();
    await login(`oral_${stamp}_1`,password);
    await page.getByRole('button',{name:'Vào phòng thi',exact:true}).click();
    await page.getByRole('button',{name:'Bắt đầu lượt thi',exact:true}).click();
    await expect(page.getByRole('timer')).toContainText('giây');
    // Typed transcript tests persistence; microphone/STT/TTS need a real device check.
    await page.getByLabel('Transcript (có thể sửa trước khi gửi)').fill('The domain depends on abstractions rather than concrete infrastructure.');
    await page.getByRole('button',{name:'Gửi câu trả lời',exact:true}).click();
    await page.getByRole('button',{name:'Tiếp tục / hỏi đào sâu',exact:true}).click();
    await expect(page.getByText('Lượt thi đã hoàn thành.',{exact:false})).toBeVisible();
    await page.reload(); await page.getByRole('button',{name:'Xem transcript',exact:true}).click();
    await expect(page.getByText('The domain depends on abstractions rather than concrete infrastructure.',{exact:true})).toBeVisible();
    const studentToken=await page.evaluate(() => sessionStorage.getItem('aives-token'));
    const firstState=await api('GET',`/interviews/${first}`,null,studentToken);
    const secondToken=(await api('POST','/auth/login',{username:`oral_${stamp}_2`,password},null)).token;
    const secondState=await api('POST',`/interviews/${second}/start`,null,secondToken);
    expect(secondState.logs[0].questionId).not.toBe(firstState.logs[0].questionId);
    const logId=secondState.logs[0].logId;
    await api('POST',`/interviews/${second}/answer`,{logId,transcript:'Use domain interfaces and inject infrastructure implementations.'},secondToken);
    await api('POST',`/interviews/${second}/next?afterLogId=${logId}`,null,secondToken);
    await api('POST',`/exams/${examId}/complete`,null);
  } finally { writeFileSync('test-results/oral-fixtures.json',JSON.stringify(fixture)); }
});
