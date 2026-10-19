import React from 'react';
import {BookOpen,Users,CircleHelp,CalendarDays,ArrowRight} from 'lucide-react';
import {api} from '../../services/api';
import {useRemote,Heading,Notice,Panel,button} from './parts';
export default function Dashboard({user,onNavigate}){
 const courses=useRemote(()=>api.courses());const admin=user.role==='ADMIN';const users=useRemote(()=>admin?api.users():Promise.resolve([]),[admin]);const prefix=admin?'admin':'lecturer';
 const stats=admin?[[BookOpen,'Môn học & sinh viên',courses.loading?'…':courses.items.length,'courses'],[Users,'Người dùng',users.loading?'…':users.items.length,'users']]:[[BookOpen,'Giám sát ca thi','Tiến độ & hội thoại','monitor'],[CircleHelp,'Quản lý câu hỏi','Chờ duyệt / chính thức','questionbank'],[CalendarDays,'Kỳ thi & lịch thi','Giáo viên quản lý','sessions']];
 return <div className="space-y-6"><Heading title={admin?'Tổng quan quản trị':'Không gian giảng viên'} subtitle={`Xin chào, ${user.fullName||user.email}. Các số liệu chỉ hiển thị khi backend có API tương ứng.`}/>
 {(courses.error||users.error)&&<Notice type="error">{courses.error||users.error}</Notice>}
 <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{stats.filter(x=>admin||x[3]!=='users').map(([Icon,title,number,target])=><button onClick={()=>onNavigate(`${prefix}-${target}`)} key={target} className="p-5 text-left bg-surface rounded-xl border border-appborder hover:border-primary transition-colors"><Icon size={24} className="text-primary mb-3"/><div className="font-bold text-2xl">{number}</div><div className="text-sm text-mutedtext">{title}</div><div className="flex items-center gap-1 text-xs text-primary mt-3">Mở quản lý <ArrowRight size={13}/></div></button>)}</div>
 <Panel title="Phân công nghiệp vụ"><ol className="list-decimal pl-5 space-y-2 text-sm"><li>Quản trị viên tạo tài khoản, môn học, phân công giáo viên và ghi danh sinh viên.</li><li>Giáo viên quản lý tài liệu và rubric; tạo câu hỏi thủ công hoặc dùng AI.</li><li>Giáo viên kiểm tra, chỉnh sửa, loại bỏ và duyệt. Chỉ câu đã duyệt được đưa vào ngân hàng chính thức.</li><li>Giáo viên tạo kỳ thi, quản lý đề, phân lịch sinh viên đã ghi danh và giám sát ca thi.</li><li>Sinh viên đăng nhập, chọn kỳ thi trong lịch của mình và tham gia phỏng vấn AI.</li></ol></Panel>
 </div>;
}
