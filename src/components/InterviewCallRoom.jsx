import React from 'react';
import { AudioLines, Mic, MicOff, Captions, MessageSquareText, Maximize2, Minimize2, Keyboard, LogIn, LoaderCircle, Volume2 } from 'lucide-react';

export default function InterviewCallRoom({ phase, joined, muted, captions, transcriptOpen, live, spoken, busy,
  remaining, elapsed, fullscreen, followupsRemaining, onJoin, onMic, onCaptions, onTranscript, onText, onFullscreen, question, onReplay }) {
  const thinking=busy||phase==='thinking',speaking=phase==='speaking'&&!thinking,listening=phase==='listening'&&!muted&&!thinking;
  const label=!joined?'Sẵn sàng vào phòng':thinking?'AI đang suy nghĩ':speaking?'AI đang nói':muted?'Mic của bạn đang tắt':listening?'Đang nghe bạn':phase==='text'?'Đang trao đổi bằng văn bản':phase==='blocked'?'Kết nối cần thử lại':'Đang kết nối';
  const clock=seconds=>String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  return <section className={'voice-interview-room '+(fullscreen?'call-room-fullscreen':'')} aria-label="Cuộc phỏng vấn trực tiếp">
    <header className="call-room-header"><div className="call-room-identity"><AudioLines size={23}/><div><strong>Vấn đáp cùng giám khảo AI</strong><span>{joined?'Đang kết nối bằng giọng nói':'Một cuộc trao đổi, bắt đầu bằng lời nói'}</span></div></div>
      <div className="call-room-meta">{joined&&<span aria-label="Thời lượng cuộc gọi">{clock(elapsed)}</span>}<button type="button" className="call-icon-button" onClick={onFullscreen} aria-label={fullscreen?'Thu nhỏ phòng phỏng vấn':'Mở rộng phòng phỏng vấn'}>{fullscreen?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button></div>
    </header>
    <div className={'call-room-stage '+(speaking?'is-speaking':listening?'is-listening':'')}>
      <div className="call-ai-presence"><div className="call-avatar-halo"/><div className="call-ai-avatar" aria-hidden="true"><AudioLines size={62} strokeWidth={1.3}/></div>
        <div className={'call-voice-wave '+(speaking||listening?'wave-active':'')} aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{'--bar':i}}/>)}</div>
        <h2>Giám khảo AI</h2><p>{!joined?'Chào em, chúng ta cùng bắt đầu nhé.':thinking?'Tôi đang xem lại ý em vừa chia sẻ.':speaking?'Đang trao đổi cùng em':muted?'Em mở micro khi sẵn sàng nhé.':'Em cứ nói tự nhiên, tôi đang nghe.'}</p>
      </div>
      {captions&&joined&&<div className="call-live-captions" aria-live="polite" aria-label="Phụ đề trực tiếp"><span>{live?'Bạn':'Giám khảo AI'}</span><p>{live||spoken||'Lời nói sẽ xuất hiện ở đây.'}</p></div>}
    </div>
    {joined&&question&&<section className="call-current-question" aria-label="Câu hỏi đang trao đổi">
      <div><h3>Câu hỏi đang trao đổi</h3><p>{question}</p></div>
      <button type="button" className="call-control" onClick={onReplay} disabled={busy} aria-label="Nghe lại câu hỏi"><Volume2 size={19}/><span>Nghe lại</span></button>
    </section>}
    <div className="call-connection-status"><span className={'call-state-pill '+(speaking?'state-speaking':listening?'state-listening':'')} role="status">{thinking?<LoaderCircle size={15} className="call-spinner"/>:<span className="call-status-dot"/>}{label}</span>
      {joined&&remaining!==null&&<span className={'call-turn-timer '+(remaining<=10000?'timer-urgent':'')} role="timer">Lượt trao đổi còn {Math.ceil(remaining/1000)} giây</span>}
      {joined&&Number.isFinite(followupsRemaining)&&<span>Còn {followupsRemaining} lượt hỏi thêm</span>}
    </div>
    <footer className="call-controls">
      <button type="button" className={'call-control '+(muted?'control-muted':'')} disabled={!joined} onClick={onMic} aria-pressed={muted} aria-label={muted?'Bật micro':'Tắt micro'}>{muted?<MicOff size={21}/>:<Mic size={21}/>}<span>{muted?'Bật mic':'Micro'}</span></button>
      {!joined&&<button type="button" className="call-join-button" onClick={onJoin} disabled={busy}><LogIn size={19}/>{busy?'Đang vào phòng...':'Tham gia phỏng vấn'}</button>}
      <div className="call-control-group"><button type="button" className={'call-control '+(captions?'control-selected':'')} onClick={onCaptions} aria-pressed={captions} aria-label="Bật/tắt phụ đề"><Captions size={21}/><span>Phụ đề</span></button><button type="button" className={'call-control '+(transcriptOpen?'control-selected':'')} onClick={onTranscript} aria-pressed={transcriptOpen} aria-label="Mở/đóng hội thoại"><MessageSquareText size={21}/><span>Hội thoại</span></button><button type="button" className="call-control" onClick={onText} disabled={busy} aria-label="Chuyển sang gõ chữ"><Keyboard size={21}/><span>Gõ chữ</span></button></div>
    </footer>
    <p className="call-room-footnote">{joined?'Em có thể nói chen hoặc hỏi lại khi chưa rõ. Hội thoại được lưu để đánh giá.':'Nhấn tham gia một lần để trò chuyện bằng micro. Nên dùng tai nghe.'}</p>
  </section>;
}
