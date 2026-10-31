import React from 'react';
import {BookOpen,Users,CircleHelp,CalendarDays,ArrowRight,AudioLines,FileText,BookmarkCheck,Tv,ShieldCheck,Layers3,Sparkles} from 'lucide-react';
import {api} from '../../services/api';
import {useRemote} from './parts';
import {Badge,Button,Card,EmptyState,Skeleton} from '../ui';

const workflow=[
 'Quản trị viên tạo tài khoản, môn học, phân công giáo viên và ghi danh sinh viên.',
 'Giáo viên quản lý tài liệu và rubric; tạo câu hỏi thủ công hoặc dùng AI.',
 'Giáo viên kiểm tra, chỉnh sửa, loại bỏ và duyệt. Chỉ câu đã duyệt được đưa vào ngân hàng chính thức.',
 'Giáo viên tạo kỳ thi, quản lý đề, phân lịch sinh viên đã ghi danh và giám sát ca thi.',
 'Sinh viên đăng nhập, chọn kỳ thi trong lịch của mình và tham gia phỏng vấn AI.',
];

function OverviewCard({icon:Icon,title,value,description,onClick,loading}){
 return <Card as="button" type="button" onClick={onClick} className="group flex w-full flex-col gap-4 text-left transition-colors hover:border-primary-border hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none">
   <div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-info-soft text-info-text"><Icon aria-hidden="true" className="size-5"/></span><ArrowRight aria-hidden="true" className="mt-2 size-4 text-mutedtext"/></div>
   <div className="flex-1 space-y-1">{loading?<Skeleton className="mb-3 h-8 w-16"/>:<p className={typeof value==='number'?'text-3xl font-semibold tracking-tight text-apptext':'text-base font-semibold text-apptext'}>{value}</p>}<p className="text-sm text-mutedtext">{description}</p></div>
   <span className="flex min-h-10 items-center text-sm font-semibold text-info-text group-hover:underline">{title}<span className="sr-only"> · Mở quản lý</span></span>
 </Card>;
}
export default function Dashboard({user,onNavigate}){
 const courses=useRemote(()=>api.courses());const admin=user.role==='ADMIN';const users=useRemote(()=>admin?api.users():Promise.resolve([]),[admin]);const prefix=admin?'admin':'lecturer';
 const navigate=target=>onNavigate(`${prefix}-${target}`);
 const date=new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Bangkok'}).format(new Date());
 const links=admin?[[Users,'Người dùng & Vai trò','Tài khoản và quyền truy cập','users'],[BookOpen,'Môn học & sinh viên','Phân công và ghi danh','courses']]:[[FileText,'Tài liệu học tập','Chuẩn bị nguồn kiến thức','materials'],[BookmarkCheck,'Tiêu chí Rubric','Thiết lập tiêu chí đánh giá','rubric'],[CircleHelp,'Ngân hàng câu hỏi','Kiểm tra và duyệt nội dung','questionbank'],[CalendarDays,'Ca thi vấn đáp','Tạo ca và phân lịch thi','sessions']];
 const stats=admin?[
   [BookOpen,'Môn học & sinh viên',courses.error?'—':courses.items.length,'Môn học trong hệ thống','courses',courses.loading],
   [Users,'Người dùng',users.error?'—':users.items.length,'Tài khoản trong hệ thống','users',users.loading],
 ]:[
   [BookOpen,'Tài liệu học tập',courses.error?'—':courses.items.length,'Môn học được phân công','materials',courses.loading],
   [Tv,'Giám sát ca thi','Tiến độ & hội thoại','Theo dõi trong suốt buổi thi','monitor',false],
   [CircleHelp,'Quản lý câu hỏi','Chờ duyệt / chính thức','Bạn quyết định nội dung sử dụng','questionbank',false],
   [CalendarDays,'Kỳ thi & lịch thi','Giáo viên quản lý','Chủ động tổ chức từng ca thi','sessions',false],
 ];
 return <div className="min-w-0 space-y-6 pb-2">
   <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="space-y-1"><p className="text-xs font-semibold tracking-[0.16em] text-info-text">AIVES WORKSPACE</p><h1 className="text-[1.75rem] font-semibold tracking-tight text-apptext sm:text-page">{admin?'Tổng quan quản trị':'Không gian giảng viên'}</h1></div><p className="text-caption capitalize text-mutedtext">{date}</p></header>

   <section aria-label="Chào mừng đến với AIVES" className="relative isolate overflow-hidden rounded-2xl border border-primary-border bg-linear-to-br from-primary-light via-surface to-info-soft/60 p-5 sm:p-8">
     <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full border-[40px] border-primary/5"/>
     <div className="relative grid items-center gap-8 lg:grid-cols-[1.35fr_1fr]">
       <div className="min-w-0 space-y-5">
         <Badge variant="info"><span className="size-1.5 rounded-full bg-info-text"/>{admin?'Không gian quản trị':'Không gian giảng dạy'}</Badge>
         <div className="space-y-3"><p className="break-words text-sm font-medium text-info-text">Xin chào, {user.fullName||user.email}.</p><h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-apptext sm:text-4xl">{admin?<>Vận hành gọn gàng.<br/>Kết nối mọi lớp học.</>:<>Sẵn sàng cho một<br/>buổi vấn đáp tốt hơn.</>}</h2><p className="max-w-lg text-sm leading-6 text-mutedtext">{admin?'Quản lý tài khoản, phân công giảng viên và chuẩn bị môn học. Mọi công việc bắt đầu từ một nơi.':'Từ chuẩn bị tài liệu đến lắng nghe từng câu trả lời. AIVES hỗ trợ bạn kết nối cả hành trình đánh giá.'}</p></div>
         <div className="flex flex-wrap gap-3"><Button onClick={()=>navigate(admin?'courses':'sessions')}>{admin?'Quản lý môn học':'Quản lý ca thi'}<ArrowRight aria-hidden="true" className="size-4"/></Button><Button variant="secondary" onClick={()=>navigate(admin?'users':'questionbank')}>{admin?'Quản lý người dùng':'Xem ngân hàng câu hỏi'}</Button></div>
         <p className="flex items-center gap-2 text-caption text-mutedtext"><ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-info-text"/>{admin?'Phân quyền rõ ràng cho từng vai trò.':'AI hỗ trợ. Giảng viên quyết định.'}</p>
       </div>
       <div className="hidden rounded-2xl border border-appborder bg-surface/90 p-6 shadow-card lg:block">
         <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary text-on-primary"><AudioLines aria-hidden="true" className="size-6"/></span><div><p className="font-semibold text-apptext">Kiến thức thành đối thoại</p><p className="text-caption text-mutedtext">Một hành trình, cùng tiến bộ.</p></div></div>
         <div aria-hidden="true" className="my-6 flex h-16 items-center justify-center gap-1.5 rounded-xl bg-primary-light">{[12,20,32,18,42,28,50,36,24,44,32,18,38,48,28,20,34,14,24].map((height,index)=><span key={index} className="w-1.5 rounded-full bg-primary/70" style={{height}}/>)}</div>
         <div className="grid grid-cols-3 gap-3 text-center text-caption text-mutedtext">{[[Layers3,'Chuẩn bị'],[AudioLines,'Đối thoại'],[ShieldCheck,'Đánh giá']].map(([Icon,label])=><div key={label} className="space-y-2"><Icon aria-hidden="true" className="mx-auto size-5 text-info-text"/><p>{label}</p></div>)}</div>
       </div>
     </div>
   </section>

   {(courses.error||users.error)&&<Card><div role="alert" className="text-sm text-danger-text">{courses.error||users.error}</div><Button variant="secondary" className="mt-3" onClick={()=>{courses.reload();if(admin)users.reload();}}>Thử lại</Button></Card>}
   <section aria-label="Tổng quan công việc" className={`grid grid-cols-2 gap-3 sm:gap-4 ${admin?'':'xl:grid-cols-4'}`}>{stats.map(([Icon,title,value,description,target,loading])=><OverviewCard key={target} icon={Icon} title={title} value={value} description={description} loading={loading} onClick={()=>navigate(target)}/>)}</section>

   <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[1.1fr_1fr]">
     <Card as="section" aria-labelledby="dashboard-courses-title" className="space-y-5">
       <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="dashboard-courses-title" className="text-section font-semibold">{admin?'Môn học trong hệ thống':'Môn học của bạn'}</h2><p className="mt-1 text-caption text-mutedtext">{admin?'Nền tảng cho mỗi kỳ thi được tổ chức tốt.':'Bắt đầu từ những nội dung bạn đang phụ trách.'}</p></div><Button variant="ghost" onClick={()=>navigate(admin?'courses':'materials')}>{admin?'Xem môn học':'Mở tài liệu'}<ArrowRight aria-hidden="true" className="size-4"/></Button></div>
       {courses.loading?<div aria-busy="true" aria-label="Đang tải môn học" className="space-y-4">{[0,1,2].map(key=><Skeleton key={key} className="h-16 w-full"/>)}</div>:courses.error?<p className="text-sm text-mutedtext">Chưa thể hiển thị môn học. Vui lòng thử tải lại phía trên.</p>:courses.items.length===0?<EmptyState icon={BookOpen} title="Chưa có môn học" description={admin?'Tạo môn học và phân công giảng viên để bắt đầu.':'Bạn sẽ thấy môn học tại đây sau khi được quản trị viên phân công.'} action={<Button variant="secondary" onClick={admin?()=>navigate('courses'):courses.reload}>{admin?'Quản lý môn học':'Tải lại'}</Button>}/>:<ul className="space-y-3">{courses.items.slice(0,4).map((course,index)=><li key={course.id} className="flex items-center gap-3 rounded-xl border border-appborder bg-canvas/60 p-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-soft text-sm font-semibold text-info-text">{String(index+1).padStart(2,'0')}</span><div className="min-w-0"><p className="text-xs font-medium tracking-wide text-info-text">{course.code}</p><p className="break-words text-sm font-medium text-apptext">{course.name}</p></div></li>)}</ul>}
     </Card>
     <Card as="section" aria-labelledby="dashboard-shortcuts-title" className="space-y-5">
       <div><h2 id="dashboard-shortcuts-title" className="text-section font-semibold">Truy cập nhanh</h2><p className="mt-1 text-caption text-mutedtext">Công cụ cần thiết, ngay trong tầm tay.</p></div>
       <div className="grid gap-3 sm:grid-cols-2">{links.map(([Icon,title,description,target])=><button key={target} type="button" onClick={()=>navigate(target)} className="group min-h-28 rounded-xl border border-appborder bg-canvas/50 p-4 text-left transition-colors hover:border-primary-border hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"><div className="mb-3 flex items-center justify-between"><Icon aria-hidden="true" className="size-5 text-info-text"/><ArrowRight aria-hidden="true" className="size-4 text-mutedtext group-hover:text-info-text"/></div><p className="text-sm font-semibold text-apptext">{title}</p><p className="mt-1 text-caption text-mutedtext">{description}</p></button>)}</div>
       {!admin&&<Button variant="secondary" className="w-full" onClick={()=>navigate('monitor')}><Tv aria-hidden="true" className="size-4"/>Mở giám sát ca thi<ArrowRight aria-hidden="true" className="ml-auto size-4"/></Button>}
       <div className="flex gap-3 rounded-xl bg-info-soft p-4 text-info-text"><Sparkles aria-hidden="true" className="mt-0.5 size-5 shrink-0"/><p className="text-caption leading-6">{admin?'Phân công giảng viên và ghi danh sinh viên trước khi tổ chức ca thi.':'Chuẩn bị rubric và duyệt câu hỏi trước khi mở ca thi. Chỉ câu đã duyệt được đưa vào đề.'}</p></div>
     </Card>
   </div>
   <details className="rounded-xl border border-appborder bg-surface px-5 shadow-card"><summary className="cursor-pointer py-4 text-sm font-semibold text-apptext marker:text-info-text">Phân công nghiệp vụ</summary><ol className="list-decimal space-y-3 border-t border-appborder py-5 pl-5 text-sm leading-6 text-mutedtext">{workflow.map(item=><li key={item}>{item}</li>)}</ol></details>
 </div>;
}
