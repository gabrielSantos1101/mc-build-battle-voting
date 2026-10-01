
// ============================================================
// 1. WARDEN & SCULK FRAME (Deep Dark)
// ============================================================
export function WardenSculkFrameOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* Top: Cabeça e Chifres do Warden */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-36 h-10 flex flex-col items-center">
        {/* Chifres do Warden */}
        <div className="w-full flex justify-between items-end px-1">
          <div className="w-6 h-5 bg-[#00c9a7] border-2 border-[#04332a] shadow-[0_0_8px_#00c9a7] [clip-path:polygon(0_0,60%_0,100%_100%,20%_100%)]" />
          {/* Olho de Sculk Central */}
          <div className="w-5 h-5 bg-[#00e5ff] border-2 border-[#004d40] rotate-45 flex items-center justify-center shadow-[0_0_10px_#00e5ff]">
            <div className="w-2 h-2 bg-[#002b24] -rotate-45" />
          </div>
          <div className="w-6 h-5 bg-[#00c9a7] border-2 border-[#04332a] shadow-[0_0_8px_#00c9a7] [clip-path:polygon(40%_0,100%_0,80%_100%,0_100%)]" />
        </div>
        {/* Rosto do Warden */}
        <div className="w-20 h-4 bg-[#0a2320] border-2 border-[#00c9a7] flex items-center justify-center shadow-[0_0_12px_#00c9a766]">
          <div className="w-10 h-1.5 bg-[#020e0d] rounded-sm" />
        </div>
      </div>

      {/* 4 Cantos com Ossos e Sculk Veins */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00c9a7] shadow-[0_0_10px_#00c9a7]">
        <div className="absolute top-1 left-1 w-3 h-3 bg-[#e0ded0] border border-[#7a786e] rotate-12" />
      </div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00c9a7] shadow-[0_0_10px_#00c9a7]">
        <div className="absolute top-1 right-1 w-3 h-3 bg-[#e0ded0] border border-[#7a786e] -rotate-12" />
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00c9a7] shadow-[0_0_10px_#00c9a7]">
        <div className="absolute bottom-1 left-1 w-3 h-3 bg-[#004d40] border border-[#00c9a7]" />
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00c9a7] shadow-[0_0_10px_#00c9a7]">
        <div className="absolute bottom-1 right-1 w-3 h-3 bg-[#004d40] border border-[#00c9a7]" />
      </div>

      {/* Base: Sensor de Sculk */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#041c18] border-2 border-[#00c9a7] flex items-center gap-1 shadow-[0_0_12px_#00c9a780]">
        <div className="w-1.5 h-1.5 bg-[#00e5ff] animate-ping" />
        <div className="text-[6px] text-[#00e5ff] font-['Press_Start_2P']">SCULK</div>
        <div className="w-1.5 h-1.5 bg-[#00e5ff] animate-ping" />
      </div>
    </div>
  )
}

// ============================================================
// 2. PALE GARDEN & THE CREAKING FRAME
// ============================================================
export function PaleGardenFrameOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* Top: Galhos de Madeira Pálida Entalhada */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-40 flex items-center justify-between px-2">
        <div className="w-8 h-4 bg-[#b0b09d] border-2 border-[#545447] [clip-path:polygon(0_0,100%_20%,80%_100%,0_100%)] shadow-md" />
        <div className="px-3 py-1 bg-[#d6d6c2] border-2 border-[#636354] shadow-md flex items-center gap-1.5">
          {/* Olhos do Creaking no Topo */}
          <div className="w-2 h-1 bg-[#ff7b00] shadow-[0_0_6px_#ff7b00] animate-pulse" />
          <div className="w-2 h-1 bg-[#ff7b00] shadow-[0_0_6px_#ff7b00] animate-pulse" />
        </div>
        <div className="w-8 h-4 bg-[#b0b09d] border-2 border-[#545447] [clip-path:polygon(0_20%,100%_0,100%_100%,20%_100%)] shadow-md" />
      </div>

      {/* Cantos com Galhos Retorcidos e Olhos do Creaking Espreitando */}
      <div className="absolute -top-2 -left-2 w-10 h-10 border-t-4 border-l-4 border-[#8c8c79]">
        <div className="absolute top-2 left-2 flex gap-1 bg-[#1a1a14] p-0.5 border border-[#444] shadow-[0_0_8px_#ff7b00]">
          <div className="w-1.5 h-1.5 bg-[#ff8c00] animate-pale-eyes" />
          <div className="w-1.5 h-1.5 bg-[#ff8c00] animate-pale-eyes" />
        </div>
      </div>
      <div className="absolute -top-2 -right-2 w-10 h-10 border-t-4 border-r-4 border-[#8c8c79]">
        <div className="absolute top-2 right-2 flex gap-1 bg-[#1a1a14] p-0.5 border border-[#444] shadow-[0_0_8px_#ff7b00]">
          <div className="w-1.5 h-1.5 bg-[#ff8c00] animate-pale-eyes-delay" />
          <div className="w-1.5 h-1.5 bg-[#ff8c00] animate-pale-eyes-delay" />
        </div>
      </div>
      <div className="absolute -bottom-2 -left-2 w-10 h-10 border-b-4 border-l-4 border-[#8c8c79]">
        <div className="absolute bottom-2 left-2 flex gap-1 bg-[#1a1a14] p-0.5 border border-[#444] shadow-[0_0_8px_#ff7b00]">
          <div className="w-1.5 h-1.5 bg-[#ff8c00] animate-pale-eyes-delay" />
          <div className="w-1.5 h-1.5 bg-[#ff8c00] animate-pale-eyes-delay" />
        </div>
      </div>
      <div className="absolute -bottom-2 -right-2 w-10 h-10 border-b-4 border-r-4 border-[#8c8c79]">
        <div className="absolute bottom-2 right-2 flex gap-1 bg-[#1a1a14] p-0.5 border border-[#444] shadow-[0_0_8px_#ff7b00]">
          <div className="w-1.5 h-1.5 bg-[#ff8c00] animate-pale-eyes" />
          <div className="w-1.5 h-1.5 bg-[#ff8c00] animate-pale-eyes" />
        </div>
      </div>

      {/* Base: Tronco Pálido */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-[#3b3b30] border-2 border-[#8c8c79] shadow-lg">
        <div className="text-[6px] text-[#e0ded0] font-['Press_Start_2P']">PALE GARDEN</div>
      </div>
    </div>
  )
}

// ============================================================
// 3. JACK-O'-LANTERN & SOUL FIRE FRAME
// ============================================================
export function JackPumpkinFrameOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* Top: Abóboras Empilhadas */}
      <div className="absolute -top-7 left-3 flex items-end gap-1">
        {/* Abóbora Grande */}
        <div className="w-9 h-9 bg-[#ff7800] border-2 border-[#803300] rounded shadow-[0_0_12px_#ff7800] flex flex-col items-center justify-center relative">
          <div className="absolute -top-2 w-2 h-2 bg-[#2d6a2e] border border-[#143d15]" />
          <div className="flex gap-1 mb-1">
            <div className="w-1.5 h-1.5 bg-[#ffe600]" />
            <div className="w-1.5 h-1.5 bg-[#ffe600]" />
          </div>
          <div className="w-4 h-1.5 bg-[#ffe600] [clip-path:polygon(0_100%,20%_0,40%_100%,60%_0,80%_100%,100%_0)]" />
        </div>
        {/* Abóbora Média */}
        <div className="w-7 h-7 bg-[#ff9a3c] border-2 border-[#994700] rounded shadow-[0_0_8px_#ff9a3c] flex flex-col items-center justify-center">
          <div className="flex gap-0.5 mb-0.5">
            <div className="w-1 h-1 bg-[#fff275]" />
            <div className="w-1 h-1 bg-[#fff275]" />
          </div>
          <div className="w-3 h-1 bg-[#fff275]" />
        </div>
      </div>

      {/* Top Right: Chamas de Soul Fire */}
      <div className="absolute -top-6 right-3 flex items-end gap-1">
        <div className="w-3 h-7 bg-[#00e5ff] border border-[#008899] animate-soul-flicker shadow-[0_0_10px_#00e5ff] [clip-path:polygon(50%_0,100%_70%,80%_100%,20%_100%,0_70%)]" />
        <div className="w-4 h-9 bg-[#00f0ff] border border-[#0099aa] animate-soul-flicker shadow-[0_0_14px_#00f0ff] [clip-path:polygon(50%_0,100%_70%,80%_100%,20%_100%,0_70%)]" />
      </div>

      {/* Cantos com Tijolos de Netherrack e Chamas */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-pumpkin" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-pumpkin" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00e5ff] shadow-[0_0_8px_#00e5ff]">
        <div className="absolute bottom-1 left-1 w-2 h-4 bg-[#00e5ff] animate-soul-flicker" />
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00e5ff] shadow-[0_0_8px_#00e5ff]">
        <div className="absolute bottom-1 right-1 w-2 h-4 bg-[#00e5ff] animate-soul-flicker" />
      </div>

      {/* Base: Mini Abóboras de Rodapé */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#4d1f00] border-2 border-pumpkin flex items-center gap-2 shadow-lg">
        <div className="w-3 h-3 bg-[#ff7800] rounded-sm" />
        <div className="text-[6px] text-[#ffcc00] font-['Press_Start_2P']">HALLOWEEN</div>
        <div className="w-3 h-3 bg-[#ff7800] rounded-sm" />
      </div>
    </div>
  )
}

// ============================================================
// 4. WITHER BOSS FRAME
// ============================================================
export function WitherBossFrameOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* Top: Três Crânios de Wither */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-end gap-2">
        {/* Crânio Esquerdo */}
        <div className="w-7 h-7 bg-[#242424] border-2 border-[#555] flex flex-col items-center justify-center shadow-lg">
          <div className="flex gap-1 mb-1">
            <div className="w-1.5 h-1.5 bg-[#a0a0ff] shadow-[0_0_4px_#a0a0ff]" />
            <div className="w-1.5 h-1.5 bg-[#a0a0ff] shadow-[0_0_4px_#a0a0ff]" />
          </div>
          <div className="w-3 h-1 bg-[#000]" />
        </div>
        {/* Crânio Central Maior */}
        <div className="w-9 h-9 bg-[#1a1a1a] border-2 border-[#777] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(160,160,255,0.6)] relative -top-1">
          <div className="flex gap-1.5 mb-1">
            <div className="w-2 h-2 bg-[#b8b8ff] shadow-[0_0_8px_#b8b8ff] animate-pulse" />
            <div className="w-2 h-2 bg-[#b8b8ff] shadow-[0_0_8px_#b8b8ff] animate-pulse" />
          </div>
          <div className="w-4 h-1.5 bg-[#000]" />
        </div>
        {/* Crânio Direito */}
        <div className="w-7 h-7 bg-[#242424] border-2 border-[#555] flex flex-col items-center justify-center shadow-lg">
          <div className="flex gap-1 mb-1">
            <div className="w-1.5 h-1.5 bg-[#a0a0ff] shadow-[0_0_4px_#a0a0ff]" />
            <div className="w-1.5 h-1.5 bg-[#a0a0ff] shadow-[0_0_4px_#a0a0ff]" />
          </div>
          <div className="w-3 h-1 bg-[#000]" />
        </div>
      </div>

      {/* Cantos: Nether Fortress Bricks */}
      <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#666]" />
      <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#666]" />
      <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#666]" />
      <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#666]" />

      {/* Base: NETHER STAR Brilhante */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center">
        <div className="w-8 h-8 bg-[#ffd700] border-2 border-[#fff] rotate-45 flex items-center justify-center shadow-[0_0_20px_#ffd700,0_0_40px_#ff9900] animate-pulse">
          <div className="w-3 h-3 bg-[#fff] -rotate-45" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 5. ENDER DRAGON FRAME
// ============================================================
export function EnderDragonFrameOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* Top: Asas e Cabeça do Ender Dragon */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-48 flex flex-col items-center">
        <div className="w-full flex justify-between items-center px-1">
          {/* Asa Esquerda */}
          <div className="w-14 h-6 bg-[#210936] border-2 border-[#9d50db] [clip-path:polygon(0_100%,100%_0,80%_100%)] shadow-[0_0_10px_#7928ca]" />
          {/* Cabeça do Dragão */}
          <div className="w-9 h-7 bg-[#12041f] border-2 border-[#9d50db] flex flex-col items-center justify-center shadow-[0_0_12px_#9d50db] z-10">
            <div className="flex gap-1.5">
              <div className="w-2 h-1.5 bg-[#cc00ff] shadow-[0_0_6px_#cc00ff] animate-pulse" />
              <div className="w-2 h-2 bg-[#cc00ff] shadow-[0_0_6px_#cc00ff] animate-pulse" />
            </div>
          </div>
          {/* Asa Direita */}
          <div className="w-14 h-6 bg-[#210936] border-2 border-[#9d50db] [clip-path:polygon(0_0,100%_100%,20%_100%)] shadow-[0_0_10px_#7928ca]" />
        </div>
      </div>

      {/* Cantos com Pilares de Obsidiana */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#9d50db] shadow-[0_0_8px_#7928ca]" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#9d50db] shadow-[0_0_8px_#7928ca]" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#9d50db] shadow-[0_0_8px_#7928ca]" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#9d50db] shadow-[0_0_8px_#7928ca]" />

      {/* Base: Cristal do End & Olho do Ender */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center">
        <div className="w-8 h-8 bg-[#3d0066] border-2 border-[#cc00ff] rotate-45 flex items-center justify-center shadow-[0_0_16px_#cc00ff]">
          {/* Olho de Ender */}
          <div className="w-4 h-4 bg-[#00ff88] border border-[#004d26] rounded-full flex items-center justify-center -rotate-45 shadow-[0_0_8px_#00ff88]">
            <div className="w-1.5 h-3 bg-[#022413] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
