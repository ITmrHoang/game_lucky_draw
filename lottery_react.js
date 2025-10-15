/*
LuckyDraw React App - Single-file React component (default export)
Features implemented in this single file:
- Import participants from CSV (columns: id,name,number optional)
- Manage prizes (you can assign a fixed winner to a prize or leave it random)
- Schedule draws (set a date/time for a draw) and keep multiple draws
- Run a draw: selects winners (honoring assigned winners for special prizes) and animates the slot machine / wheel effect
- Export winners for a specific draw as CSV
- Small local "DB" using localStorage (participants, prizes, draws)
- 3D-ish slot animation implemented with CSS + a controlled slow-down sequence

How to use:
1) Create a new React app (Vite/CRA) and configure Tailwind CSS (this component uses Tailwind classes)
2) Install dependencies: framer-motion and papaparse
   npm install framer-motion papaparse
3) Drop this file (LuckyDrawApp.jsx) into your src/ and import it into App.jsx as default export
4) Run dev server

Notes & limitations:
- This is a front-end-only implementation using localStorage as persistence. For production you should add a backend (API + DB) for true multi-user concurrency and scheduling.
- Scheduling here just stores a date/time; automatic server-side triggering is not included.

*/

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Papa from "papaparse";

// Utility: download CSV
function downloadCSV(filename, rows) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Local storage keys
const LS_PARTICIPANTS = "ld_participants_v1";
const LS_PRIZES = "ld_prizes_v1";
const LS_DRAWS = "ld_draws_v1";

export default function LuckyDrawApp() {
  // participants: {id, name, number (optional)}
  const [participants, setParticipants] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_PARTICIPANTS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  });

  // prizes: {id, title, quantity, fixedWinnerId (optional)}
  const [prizes, setPrizes] = useState(() => {
    try { const raw = localStorage.getItem(LS_PRIZES); return raw ? JSON.parse(raw) : [
      { id: "p1", title: "GOLD PRIZE", quantity: 1, fixedWinnerId: null, order: 0 },
      { id: "p2", title: "SILVER PRIZE", quantity: 2, fixedWinnerId: null, order: 1 },
      { id: "p3", title: "BRONZE PRIZE", quantity: 3, fixedWinnerId: null, order: 2 },
    ]; } catch (e) { return []; }
  });

  // draws: {id, title, datetime, winners: [{prizeId, winner}], createdAt}
  const [draws, setDraws] = useState(() => {
    try { const raw = localStorage.getItem(LS_DRAWS); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  });

  const [selectedDrawId, setSelectedDrawId] = useState(null);
  const [selectedPrizeId, setSelectedPrizeId] = useState(null);

  // Animation state
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinTarget, setSpinTarget] = useState(null); // number or participant.number
  const [visibleSlots, setVisibleSlots] = useState(["-", "-", "-", "-", "-"]);
  const spinIntervalRef = useRef(null);

  useEffect(() => { localStorage.setItem(LS_PARTICIPANTS, JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem(LS_PRIZES, JSON.stringify(prizes)); }, [prizes]);
  useEffect(() => { localStorage.setItem(LS_DRAWS, JSON.stringify(draws)); }, [draws]);

  // Helpers
  function importParticipants(csvFile) {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        // Expect columns: id,name,number
        const parsed = results.data.map((r, i) => ({ id: r.id || `${Date.now()}-${i}`, name: r.name || "", number: r.number || "" }));
        setParticipants(prev => [...prev, ...parsed]);
        alert(`Imported ${parsed.length} participants`);
      }
    });
  }

  function addPrize() {
    const id = `p${Date.now()}`;
    setPrizes(prev => [...prev, { id, title: `Prize ${prev.length+1}`, quantity: 1, fixedWinnerId: null, order: prev.length }]);
  }

  function savePrize(pr) {
    setPrizes(prev => prev.map(p => p.id === pr.id ? pr : p));
  }

  function addDraw(title = null, datetime = null) {
    const id = `d${Date.now()}`;
    const newDraw = { id, title: title || `Lượt quay ${draws.length+1}`, datetime: datetime || new Date().toISOString(), winners: [], createdAt: new Date().toISOString() };
    setDraws(prev => [newDraw, ...prev]);
    setSelectedDrawId(id);
  }

  function pickRandomFromPool(pool, excludeIds = [], count = 1) {
    const filtered = pool.filter(p => !excludeIds.includes(p.id));
    const picks = [];
    const available = [...filtered];
    for (let i=0;i<count && available.length>0;i++) {
      const idx = Math.floor(Math.random()*available.length);
      picks.push(available.splice(idx,1)[0]);
    }
    return picks;
  }

  // run a draw for selected draw, following prizes order
  async function runDraw(drawId) {
    if (!drawId) { alert('Chọn lượt quay hoặc tạo lượt mới'); return; }
    const draw = draws.find(d => d.id === drawId);
    if (!draw) return;
    if (isSpinning) return;

    // Create a copy of winners
    const winners = [];

    // pool: participants who haven't already won in previous draws? We'll allow re-winning unless chosen otherwise
    const pool = participants.slice();

    // For each prize, choose winners (honor fixedWinnerId if set)
    for (const pr of prizes.sort((a,b)=>a.order-b.order)) {
      if (!pr) continue;
      const assigned = pr.fixedWinnerId ? participants.find(p=>p.id===pr.fixedWinnerId) : null;
      if (assigned) {
        winners.push(...Array(pr.quantity).fill().map(()=>({ prizeId: pr.id, prizeTitle: pr.title, winner: assigned })));
        // remove assigned from pool
        const idx = pool.findIndex(p=>p.id===assigned.id);
        if (idx>=0) pool.splice(idx,1);
      } else {
        const picks = pickRandomFromPool(pool, [], pr.quantity);
        for (const pick of picks) {
          winners.push({ prizeId: pr.id, prizeTitle: pr.title, winner: pick });
          const idx = pool.findIndex(p=>p.id===pick.id); if (idx>=0) pool.splice(idx,1);
        }
      }
    }

    // Save winners to draw
    const newDraws = draws.map(d => d.id===drawId ? { ...d, winners } : d);
    setDraws(newDraws);

    // Start visual spinning sequence for the "latest draw" showing each winner one by one
    if (winners.length>0) {
      // We'll animate the first winner prize as demo - you can click individual prizes to animate
      animateNumberSequence(winners[0].winner.number || winners[0].winner.id, winners[0].winner);
    }

    alert('Quay xong — kiểm tra danh sách winners ở lượt quay đã chọn. Bạn có thể nhấp vào từng giải để hiển thị animation.');
  }

  function animateNumberSequence(target, winnerObj=null) {
    // target can be string (phone/number) or id
    setIsSpinning(true);
    setSpinTarget(target);
    // We'll cycle through numbers by shuffling displayed values then slow down
    const poolValues = participants.map(p => p.number || p.id);
    if (poolValues.length===0) {
      // fallback digits
      poolValues.push(...["0","1","2","3","4","5","6","7","8","9"]);
    }

    let ticks = 0;
    let interval = 50; // start fast
    const maxTicks = 60; // total ticks

    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

    spinIntervalRef.current = setInterval(() => {
      ticks++;
      // choose random values for five visible slots
      const newSlots = Array.from({length:5}).map(()=> poolValues[Math.floor(Math.random()*poolValues.length)]);
      setVisibleSlots(newSlots);

      // slow down progressively
      if (ticks > maxTicks*0.6) interval = 120;
      if (ticks > maxTicks*0.8) interval = 220;
      if (ticks > maxTicks*0.9) interval = 420;

      if (ticks >= maxTicks) {
        clearInterval(spinIntervalRef.current);
        // final settle: show target across the middle
        const finalSlots = ["", "", "", "", ""];
        finalSlots[0] = poolValues[Math.floor(Math.random()*poolValues.length)];
        finalSlots[1] = poolValues[Math.floor(Math.random()*poolValues.length)];
        finalSlots[2] = String(target);
        finalSlots[3] = poolValues[Math.floor(Math.random()*poolValues.length)];
        finalSlots[4] = poolValues[Math.floor(Math.random()*poolValues.length)];
        setVisibleSlots(finalSlots);
        setIsSpinning(false);
        spinIntervalRef.current = null;
      } else {
        // adjust interval by recreating interval
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current);
          spinIntervalRef.current = setInterval(arguments.callee, interval);
        }
      }
    }, interval);
  }

  function exportWinnersForDraw(drawId) {
    const draw = draws.find(d=>d.id===drawId);
    if(!draw) { alert('Chọn lượt quay'); return; }
    if (!draw.winners || draw.winners.length===0) { alert('Lượt quay chưa có winners'); return; }
    const rows = draw.winners.map(w => ({ drawId: draw.id, drawTitle: draw.title, prize: w.prizeTitle, winnerId: w.winner.id, winnerName: w.winner.name, winnerNumber: w.winner.number }));
    downloadCSV(`winners_${draw.id}.csv`, rows);
  }

  // UI small components
  function ParticipantsPanel(){
    const fileRef = useRef();
    return (
      <div className="p-4 bg-slate-800 rounded-lg shadow-lg text-white">
        <h3 className="text-lg font-semibold">Participants</h3>
        <div className="mt-2 text-sm">Tổng: {participants.length}</div>
        <div className="mt-3 flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e)=>{ if(e.target.files[0]) importParticipants(e.target.files[0]); }} />
          <button className="px-3 py-2 bg-indigo-600 rounded" onClick={()=>fileRef.current.click()}>Import CSV</button>
          <button className="px-3 py-2 bg-rose-600 rounded" onClick={()=>{ setParticipants([]); }}>Clear</button>
          <button className="px-3 py-2 bg-emerald-600 rounded" onClick={()=>{ downloadCSV('participants_export.csv', participants); }}>Export CSV</button>
        </div>
        <div className="mt-3 max-h-36 overflow-auto text-xs">
          {participants.slice(0,50).map(p=> (<div key={p.id} className="py-1 border-b border-slate-700">{p.name} — {p.number || p.id}</div>))}
        </div>
      </div>
    );
  }

  function PrizesPanel(){
    return (
      <div className="p-4 bg-slate-800 rounded-lg shadow-lg text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Prizes</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-indigo-600 rounded" onClick={addPrize}>Add Prize</button>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {prizes.sort((a,b)=>a.order-b.order).map(pr => (
            <div key={pr.id} className="p-2 bg-slate-700 rounded flex items-center gap-2">
              <div className="flex-1">
                <input className="w-full p-1 rounded bg-slate-600 text-white" value={pr.title} onChange={(e)=> savePrize({...pr, title: e.target.value})} />
                <div className="text-xs opacity-80 mt-1">Quantity: <input type="number" min={1} value={pr.quantity} onChange={(e)=> savePrize({...pr, quantity: Math.max(1,Number(e.target.value)||1)})} className="w-16 inline-block ml-2 p-1 rounded bg-slate-600" /></div>
                <div className="text-xs opacity-80 mt-1">Fixed winner (optional):
                  <select value={pr.fixedWinnerId||""} onChange={(e)=> savePrize({...pr, fixedWinnerId: e.target.value || null})} className="ml-2 p-1 rounded bg-slate-600">
                    <option value="">— none —</option>
                    {participants.map(p=> (<option key={p.id} value={p.id}>{p.name} ({p.number||p.id})</option>))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="px-2 py-1 bg-amber-500 rounded text-black" onClick={()=>{ setSelectedPrizeId(pr.id); animateNumberSequence((pr.fixedWinnerId && participants.find(x=>x.id===pr.fixedWinnerId)) ? (participants.find(x=>x.id===pr.fixedWinnerId).number||participants.find(x=>x.id===pr.fixedWinnerId).id) : (participants.length>0?participants[Math.floor(Math.random()*participants.length)].number||participants[Math.floor(Math.random()*participants.length)].id:"—" ) )}}>Preview Spin</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function DrawsPanel(){
    return (
      <div className="p-4 bg-slate-800 rounded-lg shadow-lg text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Draws</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-emerald-600 rounded" onClick={()=> addDraw()}>Create New Draw</button>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {draws.map(d=> (
            <div key={d.id} className={`p-2 rounded ${selectedDrawId===d.id? 'ring-2 ring-indigo-400':'bg-slate-700'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{d.title}</div>
                  <div className="text-xs opacity-80">{new Date(d.datetime).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-indigo-600 rounded" onClick={()=> setSelectedDrawId(d.id)}>Select</button>
                  <button className="px-2 py-1 bg-rose-600 rounded" onClick={()=> exportWinnersForDraw(d.id)}>Export winners</button>
                  <button className="px-2 py-1 bg-yellow-500 rounded text-black" onClick={()=> runDraw(d.id)}>Run Draw</button>
                </div>
              </div>
              <div className="mt-2 text-xs">
                Winners: {d.winners ? d.winners.length : 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-rose-900 to-rose-700 p-6 text-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1">
          <ParticipantsPanel />
          <div className="mt-4"><PrizesPanel /></div>
        </div>

        <div className="col-span-2">
          <div className="p-4 bg-gradient-to-b from-slate-800 to-slate-700 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-extrabold">Lucky Draw — Quay số may mắn</h1>
              <div className="text-sm opacity-80">Selected Draw: {selectedDrawId ? draws.find(d=>d.id===selectedDrawId)?.title : 'None'}</div>
            </div>

            {/* visual slot */}
            <div className="mt-6 flex flex-col items-center">
              <div className="relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-xs uppercase bg-amber-400 text-black px-3 py-1 rounded shadow">Gold Prize</div>
                <div className="rounded-xl p-4 bg-slate-900/60 border-2 border-amber-600 shadow-inner">
                  <div className="flex gap-3 items-center justify-center">
                    {visibleSlots.map((v,i)=> (
                      <div key={i} className={`w-20 h-20 flex items-center justify-center rounded-lg shadow-2xl transform-gpu`}>
                        <motion.div animate={{ rotateX: isSpinning ? 360 : 0 }} transition={{ duration: isSpinning ? 0.6 : 0.8 }} className="text-2xl font-mono tracking-wider p-2 bg-gradient-to-b from-slate-700 to-slate-800 rounded-md border border-slate-600">
                          {v}
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className={`px-4 py-2 rounded-xl ${isSpinning ? 'bg-gray-500' : 'bg-emerald-500'}`} disabled={isSpinning} onClick={()=> runDraw(selectedDrawId)}>Run Selected Draw</button>
                <button className="px-4 py-2 rounded-xl bg-indigo-600" onClick={()=> { if(!selectedDrawId) addDraw(); else runDraw(selectedDrawId); }}>{selectedDrawId? 'Run' : 'Create & Run'}</button>
                <button className="px-4 py-2 rounded-xl bg-amber-500 text-black" onClick={()=> exportWinnersForDraw(selectedDrawId)}>Export Winners</button>
              </div>

              <div className="mt-6 w-full bg-slate-800 rounded p-3">
                <h3 className="font-semibold">Lượt quay — chi tiết winners</h3>
                <div className="mt-2">
                  {selectedDrawId ? (
                    (draws.find(d=>d.id===selectedDrawId)?.winners || []).map((w, idx)=> (
                      <div key={idx} className="flex justify-between items-center p-2 border-b border-slate-700">
                        <div>
                          <div className="font-medium">{w.prizeTitle}</div>
                          <div className="text-xs opacity-80">{w.winner.name} — {w.winner.number || w.winner.id}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 bg-indigo-600 rounded" onClick={()=> animateNumberSequence(w.winner.number || w.winner.id, w)}>Animate</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm opacity-70">Chọn lượt quay để thấy danh sách trúng.</div>
                  )}
                </div>
              </div>

            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DrawsPanel />
            <div className="p-4 bg-slate-800 rounded-lg shadow-lg text-white">
              <h3 className="text-lg font-semibold">Tips & Next Steps</h3>
              <ul className="mt-2 text-sm list-disc ml-5 space-y-1 opacity-90">
                <li>Để phân phối thật, kết nối API + database (Postgres, Mongo) và triển khai cron job để kích hoạt lượt quay tự động theo lịch.</li>
                <li>Cân nhắc khóa người đã trúng nếu không muốn trúng lại trong các lượt tiếp theo.</li>
                <li>Có thể thay animation bằng canvas / WebGL cho hiệu ứng 3D mượt hơn.</li>
                <li>Phiên bản hiện tại dùng localStorage — tốt để demo/kiểm tra.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
