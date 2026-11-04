const build=import.meta.env||{};
const bounded=(value,fallback,min,max)=>{const number=Number(value);return value!==undefined&&Number.isFinite(number)?Math.max(min,Math.min(max,number)):fallback;};

// One switch restores the old flow; tuning never changes the server's exam deadline.
export function readVoiceRepairConfig(env=globalThis){
  let enabled=build.VITE_INTERVIEW_VOICE_REPAIR!=='false';
  try{const override=env.sessionStorage?.getItem('aives-voice-repair');if(override==='off')enabled=false;else if(override==='on')enabled=true;}catch{}
  return Object.freeze({enabled,
    silenceMs:bounded(build.VITE_INTERVIEW_SILENCE_MS,3500,1200,10000),
    threshold:bounded(build.VITE_INTERVIEW_MIC_THRESHOLD,.008,.002,.05)});
}
