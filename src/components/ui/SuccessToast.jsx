import Toast from '../common/Toast';

export default function SuccessToast({ message, onClose }) {
  return message ? <div role="status"><Toast toast={{ message }} onClose={onClose} /></div> : null;
}
