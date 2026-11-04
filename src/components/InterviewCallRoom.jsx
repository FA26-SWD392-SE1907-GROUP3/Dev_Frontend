import React from 'react';
import { AudioLines, Mic, MicOff, Captions, MessageSquareText, Maximize2, Minimize2, Keyboard, LogIn, LoaderCircle, Volume2 } from 'lucide-react';

export default function InterviewCallRoom({ phase, joined, muted, captions, transcriptOpen, live, spoken, busy,
  lastAnswer, voiceActivity, captionDelay, remaining, endsWithSlot, elapsed, fullscreen, followupsRemaining, onJoin, onMic, onCaptions, onTranscript, onText, onFullscreen, question, onReplay }) {
  const thinking=busy||phase==='thinking',speaking=phase==='speaking'&&!thinking,listening=phase==='listening'&&!muted&&!thinking;
  const label=!joined?'Sẵn sàng vào phòng':thinking?'Giám khảo đang suy nghĩ':speaking?'Giám khảo đang nói':phase==='text'?'Đang trao đổi bằng văn bản':muted?'Micro đang tắt':listening?'Đang nghe em':phase==='blocked'?'Kết nối cần thử lại':'Đang kết nối';
  const presence=!joined?'Chào em, chúng ta cùng bắt đầu nhé.':thinking?'Tôi đang xem lại ý em vừa chia sẻ.':speaking?'Em nghe tôi nói nhé.':phase==='text'?'Em có thể trả lời bằng văn bản.':muted?'Em mở micro khi sẵn sàng nhé.':listening?'Em cứ nói tự nhiên, tôi đang nghe.':'Em chờ một chút nhé.';
  const studentHint=phase==='text'?'Em có thể nhập câu trả lời bên dưới.':muted?'Micro đang tắt.':captionDelay?'Phụ đề trực tiếp đang gián đoạn. Bản ghi sẽ được nhận dạng khi em ngừng nói.':listening&&voiceActivity?'Micro đã nhận tiếng. Phụ đề đang cập nhật…':listening?'Em có thể bắt đầu nói.':'Chờ giám khảo mời em trả lời.';
  const clock=seconds=>String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  return <section className={'voice-interview-room '+(fullscreen?'call-room-fullscreen':'')} aria-label="Cuộc phỏng vấn trực tiếp">
    <header className="call-room-header"><div className="call-room-identity"><AudioLines size={23}/><div><strong>Vấn đáp cùng giám khảo AI</strong><span>{joined?'Đang kết nối bằng giọng nói':'Một cuộc trao đổi, bắt đầu bằng lời nói'}</span></div></div>
      <div className="call-room-meta">{joined&&<span aria-label="Thời lượng cuộc gọi">{clock(elapsed)}</span>}<button type="button" className="call-icon-button" onClick={onFullscreen} aria-label={fullscreen?'Thu nhỏ phòng phỏng vấn':'Mở rộng phòng phỏng vấn'}>{fullscreen?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button></div>
    </header>
    <div className={'call-room-stage '+(speaking?'is-speaking':listening?'is-listening':'')}>
      <div className="call-ai-presence"><div className="call-avatar-halo"/><div className="call-ai-avatar" aria-hidden="true"><AudioLines size={62} strokeWidth={1.3}/></div>
        <div className={'call-voice-wave '+(speaking||listening?'wave-active':'')} aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{'--bar':i}}/>)}</div>
        <h2>Giám khảo AI</h2><p>{presence}</p>
      </div>
      {captions&&joined&&<div className="call-caption-stack" aria-label="Phụ đề trực tiếp">
        {spoken&&<div className="call-live-captions" aria-live="polite"><span>Giám khảo AI</span><p>{spoken}</p></div>}
        <div className="call-live-captions" aria-live="polite"><span>{!live&&lastAnswer?'Thí sinh · Lượt trước':'Thí sinh'}</span>
          <p>{live||lastAnswer||studentHint}</p>
          {!live&&lastAnswer&&<small>{studentHint}</small>}
        </div>
      </div>}
    </div>
    {joined&&question&&<section className="call-current-question" aria-label="Câu hỏi đang trao đổi">
      <div><h3>Câu hỏi đang trao đổi</h3><p>{question}</p></div>
      <button type="button" className="call-control" onClick={onReplay} disabled={busy} aria-label="Nghe lại câu hỏi"><Volume2 size={19}/><span>Nghe lại</span></button>
    </section>}
    <div className="call-connection-status"><span className={'call-state-pill '+(speaking?'state-speaking':listening?'state-listening':'')} role="status">{thinking?<LoaderCircle size={15} className="call-spinner"/>:<span className="call-status-dot"/>}{label}</span>
      {joined&&remaining!==null&&<span className={'call-turn-timer '+(remaining<=10000?'timer-urgent':'')} role="timer">{endsWithSlot?'Ca thi còn':'Lượt trao đổi còn'} {Math.ceil(remaining/1000)} giây</span>}
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
