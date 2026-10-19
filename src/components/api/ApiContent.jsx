import React from 'react';
import Users from './Users';
import Courses from './Courses';
import Materials from './Materials';
import Questions from './Questions';
import Exams from './Exams';
import { Empty, Notice } from './parts';

export default function ApiContent({ user, section }) {
  let content;
  switch (section) {
    case 'users':
      content = user.role === 'ADMIN'
        ? <Users user={user} />
        : <Notice type="error">Chỉ Admin được truy cập tài khoản.</Notice>;
      break;
    case 'courses':
      content = user.role === 'ADMIN'
        ? <Courses user={user} />
        : <Notice type="error">Chỉ Admin quản lý môn học và sinh viên.</Notice>;
      break;
    case 'questions':
      content = <Questions />;
      break;
    case 'exams':
      content = <Exams />;
      break;
    case 'materials':
      content = <Materials />;
      break;
    default:
      content = <Empty>Chức năng chưa hỗ trợ.</Empty>;
  }
  return <div className="api-content space-y-5">{content}</div>;
}
