# NODE.JS — COMPLETE DEEP LEARNING
## Remaining Phases: 2, 4, 6, 7, 10, 11, 12, 13, 14

---

# ═══════════════════════════════════════════
# PHASE 2 — EVENT LOOP MASTERCLASS
# ═══════════════════════════════════════════

> Note: Call Stack (Topic 1) already covered in chat.

---

## TOPIC 2 — CALLBACK QUEUE (Macrotask Queue)

### Story — Kyun Aaya

Socho ek restaurant hai. Orders aate hain — chef ek ek order banata hai. Lekin agar ek order ka material bahar se mangwana pada — toh chef ruka nahi rehta. Woh agle order pe chala jaata hai. Jab material aa jaata hai — woh order ek queue mein wait karta hai. Jab chef free hota hai — queue se next order uthata hai.

Yahi Callback Queue hai — jab async operations complete hote hain, unke callbacks yahan wait karte hain Chef (Event Loop) ka.

### Internals — Bilkul Andar Se

Callback Queue (officially Macrotask Queue) ek FIFO (First In, First Out) queue hai. Yeh V8 ke bahar hota hai — Libuv manage karta hai ise. Jab bhi koi async operation complete hota hai — uska callback is queue mein push hota hai.

```
┌─────────────────────────────────────────────────────┐
│              CALLBACK QUEUE (Macrotask)             │
│                                                     │
│  [ cb1 ] [ cb2 ] [ cb3 ] [ cb4 ]                   │
│    ↑                               ↑                │
│  Oldest (next to execute)       Newest (just added) │
│                                                     │
│  FIFO — Jo pehle aaya, pehle jaayega                │
└─────────────────────────────────────────────────────┘
```

### Kaun Kaun Callback Queue Mein Jaata Hai

```
setTimeout callback       → Callback Queue
setInterval callback      → Callback Queue
setImmediate callback     → Check Queue (special — baad mein)
I/O callbacks (fs, net)   → I/O Callback Queue
UI Events (browser)       → Callback Queue
```

### Code — Step By Step

```javascript
const fs = require('fs');

console.log("A"); // 1. Seedha Call Stack pe

setTimeout(() => {
    console.log("B"); // 4. Callback Queue se aayega
}, 0);

fs.readFile('file.txt', 'utf8', () => {
    console.log("C"); // 5. I/O complete hone ke baad
});

Promise.resolve().then(() => {
    console.log("D"); // 3. Microtask Queue se — Callback se PEHLE
});

console.log("E"); // 2. Seedha Call Stack pe

// Output: A, E, D, B, C (approximately)
// C ka timing file size pe depend karta hai
```

### Visual — Sab Queues Ek Saath

```
┌──────────────────────────────────────────────────────────┐
│                    NODE.JS RUNTIME                       │
│                                                          │
│  ┌─────────────────┐     ┌────────────────────────────┐ │
│  │   CALL STACK    │     │         QUEUES             │ │
│  │                 │     │                            │ │
│  │  console.log()  │     │  Microtask Queue:          │ │
│  │  main()         │     │  [Promise.then callbacks]  │ │
│  │                 │     │  [process.nextTick]        │ │
│  └────────┬────────┘     │                            │ │
│           │              │  Macrotask Queue:          │ │
│           │              │  [setTimeout callbacks]    │ │
│           │              │  [setInterval callbacks]   │ │
│           │              │                            │ │
│           │              │  I/O Queue:                │ │
│           │              │  [fs, net callbacks]       │ │
│           │              │                            │ │
│           │              │  Check Queue:              │ │
│           │              │  [setImmediate callbacks]  │ │
│           │              └────────────────────────────┘ │
│           │                          │                   │
│           └──────── EVENT LOOP ──────┘                   │
│                  (Stack khaali hua?                       │
│                   Queue se next lo)                       │
└──────────────────────────────────────────────────────────┘
```

---

## TOPIC 3 — MICROTASK QUEUE

### Kya Hai Aur Kyun Special Hai

Microtask Queue ka ek special privilege hai — **Callback Queue se hamesha pehle execute hoti hai**. Matlab jab bhi Call Stack khaali hota hai — Event Loop pehle Microtask Queue poori khaali karta hai, phir Callback Queue se ek item leta hai.

### Microtask Queue Mein Kaun Jaata Hai

```
Promise.then() callback     → Microtask Queue
Promise.catch() callback    → Microtask Queue
Promise.finally() callback  → Microtask Queue
queueMicrotask()            → Microtask Queue
MutationObserver (browser)  → Microtask Queue
```

### Priority Order — Bahut Important

```
┌─────────────────────────────────────────────────────┐
│              EXECUTION PRIORITY                     │
│                                                     │
│  1. process.nextTick Queue  ← SABSE PEHLE          │
│  2. Microtask Queue         ← DOOSRA               │
│  3. Macrotask Queue         ← TEESRA               │
│                                                     │
│  Rule: Upar wali queue poori khaali ho —           │
│        tab neeche wali se ek item lo                │
└─────────────────────────────────────────────────────┘
```

### Code — Priority Prove Karo

```javascript
console.log("1 — Synchronous");

setTimeout(() => console.log("2 — setTimeout"), 0);

Promise.resolve()
    .then(() => console.log("3 — Promise.then"));

process.nextTick(() => console.log("4 — nextTick"));

queueMicrotask(() => console.log("5 — queueMicrotask"));

console.log("6 — Synchronous");

// Output:
// 1 — Synchronous
// 6 — Synchronous
// 4 — nextTick          ← process.nextTick sabse pehle
// 3 — Promise.then      ← Microtask
// 5 — queueMicrotask    ← Microtask
// 2 — setTimeout        ← Macrotask sabse baad
```

### Starvation Problem — Edge Case

```javascript
// ❌ DANGEROUS — Microtask Queue kabhi khaali nahi hogi
function infiniteMicrotask() {
    Promise.resolve().then(infiniteMicrotask);
}

infiniteMicrotask();

setTimeout(() => {
    console.log("Yeh kabhi nahi chalega!");
    // setTimeout callback Callback Queue mein hai
    // Microtask Queue kabhi khaali nahi hoti
    // Event Loop Callback Queue tak pahunch hi nahi sakta
}, 0);
```

---

## TOPIC 4 — EVENT LOOP — PHASES (6 Phases)

### Event Loop Kya Hai Bilkul Andar Se

Event Loop ek infinite loop hai jo Node.js process ke andar chalti rehti hai jab tak koi pending work hai. Yeh C++ mein likhi hai — Libuv ka part hai. JavaScript se bahar hai.

### 6 Phases — Official Node.js Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  EVENT LOOP CYCLE                       │
│                                                         │
│   ┌──────────┐                                          │
│   │  timers  │ ← setTimeout, setInterval callbacks      │
│   └────┬─────┘                                          │
│        │                                                │
│   ┌────▼──────────┐                                     │
│   │ pending       │ ← I/O errors, previous cycle        │
│   │ callbacks     │   se pending callbacks              │
│   └────┬──────────┘                                     │
│        │                                                │
│   ┌────▼──────────┐                                     │
│   │ idle, prepare │ ← Internal Node.js use only         │
│   └────┬──────────┘                                     │
│        │                                                │
│   ┌────▼──────────┐                                     │
│   │     poll      │ ← NEW I/O events fetch karo         │
│   │               │   blocking wait yahan hoti hai      │
│   └────┬──────────┘                                     │
│        │                                                │
│   ┌────▼──────────┐                                     │
│   │    check      │ ← setImmediate callbacks            │
│   └────┬──────────┘                                     │
│        │                                                │
│   ┌────▼──────────────┐                                 │
│   │ close callbacks   │ ← socket.on('close', ...)       │
│   └────┬──────────────┘                                 │
│        │                                                │
│        └──────────────────── (wapas shuru)              │
│                                                         │
│   NOTE: Har phase ke BAAD — Microtask Queue check hoti  │
└─────────────────────────────────────────────────────────┘
```

### Phase 1 — TIMERS

setTimeout aur setInterval ke callbacks yahan execute hote hain. Lekin ek important baat — **exact time guarantee nahi hota**. Agar tune `setTimeout(fn, 100)` likha — callback 100ms ke BAAD kisi waqt chalega — exactly 100ms pe nahi.

```javascript
const start = Date.now();

setTimeout(() => {
    // Yeh 100ms pe nahi — 100ms ke baad KUCH WAQT mein
    console.log(`Actual delay: ${Date.now() - start}ms`);
    // Output: 103ms, 105ms, 102ms — kabhi exact 100 nahi
}, 100);

// Kyun? Poll phase mein Event Loop I/O wait karta hai
// Agar koi I/O event aaya — woh pehle process hoga
// Tab Timer phase mein aayega
```

### Phase 4 — POLL (Sabse Important Phase)

Yeh Event Loop ka heart hai. Yahan do kaam hote hain:

1. **Naye I/O events process karo** — fs callbacks, network callbacks
2. **Block karo** agar koi pending kaam nahi — OS se naye events ka wait karo

```
Poll Phase Logic:
┌──────────────────────────────────────────┐
│  Poll Queue mein kuch hai?               │
│           │                              │
│    YES ───┤──→ Sab execute karo          │
│           │    phir agle phase pe jao    │
│    NO  ───┤                              │
│           │  setImmediate pending hai?   │
│           │      │                       │
│     YES ──┤──────┤──→ Check phase pe jao │
│           │      │                       │
│     NO ───┤──────┘                       │
│           │  Timer threshold aa gayi?    │
│     YES ──┤──→ Timer phase pe jao        │
│           │                              │
│     NO  ──┤──→ Block karo — OS ka wait  │
│              (new I/O events ka intezaar) │
└──────────────────────────────────────────┘
```

### Phase 5 — CHECK (setImmediate)

```javascript
const fs = require('fs');

// setImmediate HAMESHA I/O ke baad Check phase mein chalega
fs.readFile('file.txt', () => {
    setTimeout(() => console.log("setTimeout"), 0);
    setImmediate(() => console.log("setImmediate"));
    
    // OUTPUT HAMESHA:
    // setImmediate   ← pehle (Check phase)
    // setTimeout     ← baad mein (next Timer phase)
    
    // I/O callback ke ANDAR — setImmediate guaranteed pehle hai
});

// I/O ke BAHAR — order guarantee nahi
setTimeout(() => console.log("setTimeout outside"), 0);
setImmediate(() => console.log("setImmediate outside"));
// Yahan order OS timing pe depend karta hai
```

---

## TOPIC 5 — process.nextTick

### Kya Hai

`process.nextTick` technically Event Loop ka part nahi hai. Yeh ek special queue hai jo **current operation ke complete hote hi** — Event Loop ke kisi bhi phase se pehle execute hoti hai.

```javascript
console.log("1");

process.nextTick(() => {
    console.log("2 — nextTick");
});

process.nextTick(() => {
    console.log("3 — nextTick 2");
});

console.log("4");

// Output: 1, 4, 2, 3
// nextTick callbacks current operation ke baad,
// Event Loop phases se pehle
```

### Real World Use Case

```javascript
// API design mein use hota hai
function readData(callback) {
    const cache = getFromCache();
    
    if(cache) {
        // ❌ Galat — callback synchronously call karna
        callback(null, cache); // Inconsistent behavior
        return;
    }
    
    // ✅ Sahi — nextTick se consistent async behavior
    if(cache) {
        process.nextTick(() => callback(null, cache));
        return;
    }
    
    // Actual async operation
    fetchFromDB(callback);
}
// Rule: Ek function ya hamesha sync ho ya hamesha async
// nextTick sync ko async bana deta hai consistently
```

### Danger — nextTick Recursion

```javascript
// ❌ NEVER KARO — I/O starve ho jaayega
function recursiveNextTick() {
    process.nextTick(recursiveNextTick);
}
recursiveNextTick();
// Event Loop kabhi aage nahi badhega
// I/O operations kabhi execute nahi honge
```

---

## TOPIC 6 — setTimeout vs setImmediate vs process.nextTick

### Complete Comparison

```
┌────────────────────────────────────────────────────────────┐
│         setTimeout vs setImmediate vs nextTick             │
│                                                            │
│  process.nextTick:                                         │
│  • Event Loop ka part nahi                                 │
│  • Current operation ke immediately baad                   │
│  • Sabse pehle execute hota hai                            │
│  • I/O starve kar sakta hai agar recursion ho              │
│  • Use: Consistent async API design                        │
│                                                            │
│  Promise.then (Microtask):                                 │
│  • nextTick ke baad, Macrotask se pehle                    │
│  • Har Event Loop phase ke baad check hoti hai             │
│  • Use: Async operations ka result handle karna            │
│                                                            │
│  setImmediate:                                             │
│  • Check phase mein execute hota hai                       │
│  • I/O callbacks ke baad guaranteed                        │
│  • Use: I/O ke baad kuch immediately karna                 │
│                                                            │
│  setTimeout(fn, 0):                                        │
│  • Timer phase mein execute hota hai                       │
│  • Minimum 1ms delay (HTML5 spec)                          │
│  • I/O ke baad order guarantee nahi                        │
│  • Use: Defer execution, UI updates (browser)              │
└────────────────────────────────────────────────────────────┘
```

### Production Decision Chart

```
Kab kya use karein?

Kuch current sync code ke baad immediately chahiye?
  → process.nextTick()

Promise result handle karna hai?
  → .then() / async-await

I/O ke baad kuch karna hai?
  → setImmediate()

Time-based delay chahiye?
  → setTimeout()

Repeat karna hai?
  → setInterval() — lekin clear karna mat bhoolna!
```

---

## TOPIC 7 — EVENT LOOP COMPLETE EXECUTION ORDER — Interview Level

```javascript
// Yeh code run karo aur order predict karo

async function asyncFunc() {
    console.log("4 — async func start");
    await Promise.resolve();
    console.log("7 — after await");
}

console.log("1 — start");

setTimeout(() => console.log("8 — setTimeout"), 0);

Promise.resolve()
    .then(() => console.log("5 — Promise 1"))
    .then(() => console.log("6 — Promise 2"));

process.nextTick(() => console.log("3 — nextTick"));

asyncFunc();

console.log("2 — end");

// EXACT OUTPUT:
// 1 — start
// 4 — async func start  (asyncFunc synchronously chali)
// 2 — end
// 3 — nextTick          (nextTick queue)
// 5 — Promise 1         (microtask queue)
// 7 — after await       (microtask — await ke baad resume)
// 6 — Promise 2         (microtask)
// 8 — setTimeout        (macrotask — sabse last)
```

---

## PHASE 2 PROJECT — Event Loop Visualizer

```javascript
// event-loop-visualizer.js
// Yeh tool real-time mein Event Loop phases visualize karta hai

const { performance } = require('perf_hooks');

class EventLoopVisualizer {
    constructor() {
        this.log = [];
        this.startTime = performance.now();
    }
    
    record(phase, message) {
        const time = (performance.now() - this.startTime).toFixed(2);
        this.log.push({ phase, message, time });
        console.log(`[${time}ms] [${phase}] ${message}`);
    }
    
    demonstrate() {
        this.record('SYNC', '=== Event Loop Demo Shuru ===');
        
        // Macrotask — Timer Phase
        setTimeout(() => {
            this.record('TIMER', 'setTimeout callback chala');
            
            // I/O ke andar setImmediate
            setImmediate(() => {
                this.record('CHECK', 'setImmediate (I/O ke andar)');
            });
            
            // Promise from timer
            Promise.resolve().then(() => {
                this.record('MICROTASK', 'Promise from timer callback');
            });
            
        }, 0);
        
        // Microtask
        Promise.resolve()
            .then(() => {
                this.record('MICROTASK', 'Promise.then — 1st');
                return Promise.resolve();
            })
            .then(() => {
                this.record('MICROTASK', 'Promise.then — 2nd (chained)');
            });
        
        // nextTick
        process.nextTick(() => {
            this.record('NEXTTICK', 'process.nextTick callback');
            
            // nextTick ke andar nextTick
            process.nextTick(() => {
                this.record('NEXTTICK', 'Nested nextTick');
            });
        });
        
        // setImmediate
        setImmediate(() => {
            this.record('CHECK', 'setImmediate callback');
        });
        
        this.record('SYNC', '=== Synchronous code khatam ===');
    }
}

const viz = new EventLoopVisualizer();
viz.demonstrate();

// Baad mein report print karo
setTimeout(() => {
    console.log('\n=== EXECUTION SUMMARY ===');
    console.log('Total operations:', viz.log.length);
    
    const phases = {};
    viz.log.forEach(entry => {
        phases[entry.phase] = (phases[entry.phase] || 0) + 1;
    });
    
    Object.entries(phases).forEach(([phase, count]) => {
        console.log(`${phase}: ${count} operations`);
    });
}, 100);
```

---

# ═══════════════════════════════════════════
# PHASE 4 — LIBUV + THREADPOOL
# ═══════════════════════════════════════════

---

## TOPIC 1 — LIBUV KYA HAI BILKUL ANDAR SE

### Story — Kyun Bana

2009 mein Ryan Dahl ne Node.js banaya. Problem yeh thi — JavaScript engine (V8) sirf JS execute kar sakti thi. File operations, network operations, DNS queries — yeh sab OS-level kaam tha. Alag alag OS par alag APIs thi — Linux mein `epoll`, Mac mein `kqueue`, Windows mein `IOCP`.

Koi ek abstraction layer chahiye thi jo sab OS pe kaam kare. **Libuv** wahi layer hai — C mein likha gaya library jo Node.js aur OS ke beech baat karta hai.

### Libuv Ka Complete Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NODE.JS                              │
│                                                         │
│  JavaScript Code                                        │
│       ↓                                                 │
│  V8 Engine (JS execute karta hai)                       │
│       ↓                                                 │
│  Node.js Bindings (C++ — bridge)                        │
│       ↓                                                 │
│  ┌──────────────────────────────────┐                   │
│  │            LIBUV                │                   │
│  │                                  │                   │
│  │  Event Loop    Thread Pool       │                   │
│  │  ┌─────────┐  ┌──────────────┐  │                   │
│  │  │ I/O     │  │ Thread 1     │  │                   │
│  │  │ Timers  │  │ Thread 2     │  │                   │
│  │  │ Network │  │ Thread 3     │  │                   │
│  │  │ Events  │  │ Thread 4     │  │                   │
│  │  └─────────┘  └──────────────┘  │                   │
│  └──────────────────────────────────┘                   │
│       ↓                                                 │
│  ┌────────────────────────────────────┐                 │
│  │         OPERATING SYSTEM          │                 │
│  │  Linux: epoll  Mac: kqueue        │                 │
│  │  Windows: IOCP                    │                 │
│  │  File System, Network, DNS        │                 │
│  └────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## TOPIC 2 — THREADPOOL INTERNALS

### Kya Hai Thread Pool

Libuv ke paas default **4 threads** hain ek pool mein. Yeh threads JavaScript ke main thread se alag hain. Jab koi blocking operation hoti hai — Libuv use ek thread mein background pe karta hai — main thread free rehta hai.

```
┌─────────────────────────────────────────────────────────┐
│                   THREAD POOL                           │
│                                                         │
│  Main JS Thread:                                        │
│  ─────────────────────────────────────────→ (never      │
│                                              blocks)    │
│                                                         │
│  Thread Pool:                                           │
│  Thread 1: [fs.readFile task]  ──────→ OS disk read    │
│  Thread 2: [crypto.pbkdf2 task] ─────→ CPU computation │
│  Thread 3: [dns.lookup task]   ──────→ OS DNS query    │
│  Thread 4: [IDLE — waiting]                            │
│                                                         │
│  Jab task complete hota hai:                            │
│  Thread → Result → Callback Queue → Event Loop →        │
│  Main Thread pe callback execute                        │
└─────────────────────────────────────────────────────────┘
```

### Kaunse Operations Thread Pool Use Karte Hain

```
✅ Thread Pool USE karta hai:
   fs.*          → File read/write/stat
   crypto.*      → pbkdf2, scrypt, randomBytes
   dns.lookup()  → DNS resolution
   zlib.*        → Compression/decompression
   Custom C++ addons (agar thread pool request kare)

❌ Thread Pool USE NAHI karta:
   Network I/O   → TCP/UDP — OS ke async primitives use karta
   http requests → Kernel level async
   setTimeout    → Libuv timers — thread pool nahi
   WebSockets    → Network layer — thread pool nahi
```

### Network vs File System — Kyun Alag Hain

```
┌──────────────────────────────────────────────────────┐
│  FILE SYSTEM:                                        │
│  OS mein file I/O true async nahi hota               │
│  (especially Linux pe — partial support)             │
│  Isliye Libuv thread pool mein blocking call karta   │
│  Thread block hota hai — main thread nahi            │
│                                                      │
│  NETWORK I/O:                                        │
│  OS ke paas true async primitives hain               │
│  epoll/kqueue/IOCP — kernel level async              │
│  Libuv inhe directly use karta hai                   │
│  Koi thread block nahi hota                          │
│  Isliye Node.js 10,000 connections handle kar sakta  │
└──────────────────────────────────────────────────────┘
```

---

## TOPIC 3 — UV_THREADPOOL_SIZE

### Default 4 Threads — Kab Problem Hoti Hai

```javascript
const crypto = require('crypto');
const { performance } = require('perf_hooks');

// 8 heavy crypto operations ek saath
const start = performance.now();

let completed = 0;

for(let i = 0; i < 8; i++) {
    crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', () => {
        completed++;
        console.log(`Task ${completed} done: ${(performance.now() - start).toFixed(0)}ms`);
    });
}

// Default 4 threads ke saath output:
// Task 1 done: ~1000ms  (4 tasks ek saath, 1 second mein)
// Task 2 done: ~1000ms
// Task 3 done: ~1000ms
// Task 4 done: ~1000ms
// Task 5 done: ~2000ms  (4 tasks wait kiye — phir chalе)
// Task 6 done: ~2000ms
// Task 7 done: ~2000ms
// Task 8 done: ~2000ms
```

### Thread Pool Size Badhao

```javascript
// ⚠️ Script se pehle environment variable set karo
// Linux/Mac: UV_THREADPOOL_SIZE=8 node app.js
// Windows: set UV_THREADPOOL_SIZE=8 && node app.js

// Ya code mein (process shuru hone se PEHLE):
process.env.UV_THREADPOOL_SIZE = 8;

// Ab 8 tasks simultaneously chalenge — ~1000ms mein sab done
```

### Production Mein Kaise Set Karein

```javascript
// ecosystem.config.js (PM2)
module.exports = {
    apps: [{
        name: 'my-app',
        script: 'app.js',
        env: {
            UV_THREADPOOL_SIZE: 16,  // 4 * CPU cores (typical)
            NODE_ENV: 'production'
        }
    }]
};
```

---

## TOPIC 4 — fs MODULE INTERNALS

```javascript
const fs = require('fs');

// fs.readFile internally yeh karta hai:
// 1. JS → Node.js C++ binding
// 2. C++ binding → Libuv ko request
// 3. Libuv → Thread Pool ka ek thread le
// 4. Thread → OS system call (read syscall)
// 5. OS → Disk se data laya
// 6. Thread → Result Libuv ko diya
// 7. Libuv → Event Loop ko notify kiya
// 8. Event Loop → Callback Queue mein daala
// 9. Event Loop → Callback execute kiya

// Yeh poori journey ek fs.readFile call mein hoti hai
```

### Thread Starvation Demo

```javascript
const fs = require('fs');
const crypto = require('crypto');

// 4 heavy crypto operations thread pool block karenge
for(let i = 0; i < 4; i++) {
    crypto.pbkdf2('pass', 'salt', 500000, 64, 'sha512', () => {
        console.log(`Crypto ${i} done`);
    });
}

// Yeh fs.readFile WAIT karega kyunki sab threads busy hain
// Thread pool starvation!
fs.readFile('small-file.txt', () => {
    console.log('File read — thread milne ke baad');
});
```

---

## TOPIC 5 — CPU BLOCKING PROBLEMS

### Event Loop Block — Sabse Bada Anti-Pattern

```javascript
const http = require('http');

// ❌ PRODUCTION DISASTER
const server = http.createServer((req, res) => {
    if(req.url === '/compute') {
        // Yeh 5 seconds CPU use karega
        // Is waqt KOI BHI request handle nahi hogi
        let result = 0;
        for(let i = 0; i < 5e9; i++) {
            result += i;
        }
        res.end(`Result: ${result}`);
    }
});

// Solution 1: Worker Threads (Phase 10 mein)
// Solution 2: Child Process
// Solution 3: Work ko chunks mein todno setImmediate se

// ✅ Chunked approach
function heavyComputation(limit, callback) {
    let result = 0;
    let i = 0;
    
    function chunk() {
        const chunkSize = 1e6; // 1 million per chunk
        const end = Math.min(i + chunkSize, limit);
        
        for(; i < end; i++) {
            result += i;
        }
        
        if(i < limit) {
            setImmediate(chunk); // Event Loop ko breathe karne do
        } else {
            callback(result);
        }
    }
    
    chunk();
}
```

---

## PHASE 4 PROJECT — Thread Pool Monitor

```javascript
// threadpool-monitor.js

const crypto = require('crypto');
const fs = require('fs');
const { performance } = require('perf_hooks');

class ThreadPoolMonitor {
    constructor(poolSize = 4) {
        this.poolSize = poolSize;
        this.activeTasks = 0;
        this.completedTasks = 0;
        this.queuedTasks = 0;
        this.taskHistory = [];
        
        process.env.UV_THREADPOOL_SIZE = poolSize;
    }
    
    trackCrypto(id) {
        this.queuedTasks++;
        const start = performance.now();
        
        if(this.activeTasks < this.poolSize) {
            this.activeTasks++;
            this.queuedTasks--;
        }
        
        return new Promise((resolve) => {
            crypto.pbkdf2('password', `salt${id}`, 100000, 64, 'sha512', 
                (err, key) => {
                    const duration = performance.now() - start;
                    this.activeTasks--;
                    this.completedTasks++;
                    
                    this.taskHistory.push({
                        id,
                        type: 'crypto',
                        duration: duration.toFixed(2),
                        thread: this.getThreadEstimate(start)
                    });
                    
                    resolve(key);
                }
            );
        });
    }
    
    getThreadEstimate(start) {
        // Rough thread estimation based on timing
        return Math.floor((start % this.poolSize) + 1);
    }
    
    report() {
        console.log('\n' + '═'.repeat(50));
        console.log('      THREAD POOL MONITOR REPORT');
        console.log('═'.repeat(50));
        console.log(`Pool Size     : ${this.poolSize} threads`);
        console.log(`Completed     : ${this.completedTasks} tasks`);
        
        const durations = this.taskHistory.map(t => parseFloat(t.duration));
        const avg = durations.reduce((a,b) => a+b, 0) / durations.length;
        const max = Math.max(...durations);
        const min = Math.min(...durations);
        
        console.log(`Avg Duration  : ${avg.toFixed(2)}ms`);
        console.log(`Max Duration  : ${max.toFixed(2)}ms`);
        console.log(`Min Duration  : ${min.toFixed(2)}ms`);
        console.log('═'.repeat(50));
    }
    
    async runBenchmark(tasks = 8) {
        console.log(`\nRunning ${tasks} tasks with ${this.poolSize} threads...\n`);
        
        const start = performance.now();
        
        const promises = Array.from({ length: tasks }, (_, i) => 
            this.trackCrypto(i + 1)
        );
        
        await Promise.all(promises);
        
        const total = performance.now() - start;
        console.log(`\nTotal time: ${total.toFixed(2)}ms`);
        
        this.report();
    }
}

const monitor = new ThreadPoolMonitor(4);
monitor.runBenchmark(8);
```

---

# ═══════════════════════════════════════════
# PHASE 6 — MEMORY MANAGEMENT
# ═══════════════════════════════════════════

---

## TOPIC 1 — STACK vs HEAP MEMORY

### Node.js Mein Memory Kaise Organized Hai

```
┌─────────────────────────────────────────────────────────┐
│                  NODE.JS MEMORY                         │
│                                                         │
│  ┌──────────────────┐   ┌──────────────────────────┐   │
│  │   STACK MEMORY   │   │      HEAP MEMORY         │   │
│  │                  │   │                          │   │
│  │ • Function calls │   │ • Objects {}             │   │
│  │ • Local vars     │   │ • Arrays []              │   │
│  │ • Primitives     │   │ • Functions              │   │
│  │   (numbers,      │   │ • Closures               │   │
│  │    booleans,     │   │ • String objects         │   │
│  │    null,         │   │ • All reference types    │   │
│  │    undefined)    │   │                          │   │
│  │                  │   │  V8 manage karta hai      │   │
│  │ Fast access      │   │  GC yahan kaam karta hai  │   │
│  │ Auto cleanup     │   │  Slower than Stack        │   │
│  │ Limited size     │   │  Dynamic size             │   │
│  └──────────────────┘   └──────────────────────────┘   │
│                                                         │
│  ┌──────────────────┐   ┌──────────────────────────┐   │
│  │  EXTERNAL MEMORY │   │    CODE SPACE             │   │
│  │ (C++ objects,    │   │ (Compiled JS code)        │   │
│  │  Buffers)        │   │                          │   │
│  └──────────────────┘   └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Practical Example — Kahan Kya Jaata Hai

```javascript
// Primitives → Stack
let number = 42;          // Stack pe directly
let boolean = true;       // Stack pe directly
let nothing = null;       // Stack pe directly

// Objects → Heap (Stack pe sirf reference/pointer)
let obj = { name: 'Aryan' };  
// Stack: obj → [pointer to 0x7f3b2c]
// Heap: { name: 'Aryan' } at address 0x7f3b2c

let arr = [1, 2, 3];
// Stack: arr → [pointer to 0x7f3b40]
// Heap: [1, 2, 3] at address 0x7f3b40

// Copy behavior — important!
let a = 42;
let b = a;   // Stack pe value copy
b = 100;
console.log(a); // 42 — affect nahi hua

let obj1 = { x: 1 };
let obj2 = obj1;  // Stack pe pointer copy — SAME object
obj2.x = 999;
console.log(obj1.x); // 999 — dono same heap object point karte hain
```

---

## TOPIC 2 — V8 GARBAGE COLLECTION

### Mark and Sweep Algorithm

V8 ka GC do generation mein kaam karta hai:

```
┌─────────────────────────────────────────────────────────┐
│              V8 HEAP GENERATIONS                        │
│                                                         │
│  ┌──────────────────────────────┐                       │
│  │     NEW SPACE (Young Gen)    │                       │
│  │                              │                       │
│  │  Naye objects yahan aate hain│                       │
│  │  Size: 1-8 MB                │                       │
│  │  GC: Scavenger (fast)        │                       │
│  │  Frequency: Bohot zyada      │                       │
│  │                              │                       │
│  │  ┌──────────┐ ┌──────────┐  │                       │
│  │  │  From    │ │   To     │  │                       │
│  │  │  Space   │ │  Space   │  │                       │
│  │  └──────────┘ └──────────┘  │                       │
│  └──────────────────────────────┘                       │
│              │                                          │
│    Survive kiya (2 GC cycles) → Promote hua             │
│              ↓                                          │
│  ┌──────────────────────────────┐                       │
│  │     OLD SPACE (Old Gen)      │                       │
│  │                              │                       │
│  │  Long-lived objects          │                       │
│  │  Size: ~1.5 GB (64-bit)      │                       │
│  │  GC: Mark-Sweep-Compact      │                       │
│  │  Frequency: Kam              │                       │
│  │  Cost: Zyada (Stop-the-world)│                       │
│  └──────────────────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### Mark and Sweep — Step by Step

```
MARK PHASE:
1. GC "root" objects se shuru karta hai
   (global variables, stack variables)
2. Inse reachable sare objects ko "mark" karta hai
3. Jo mark nahi hue → Garbage!

SWEEP PHASE:
4. Unmarked objects ki memory free kari jaati hai

COMPACT PHASE:
5. Surviving objects ko pack kiya jaata hai
   (fragmentation reduce karne ke liye)

┌──────────────────────────────────────────┐
│  BEFORE GC:                              │
│  [A✓][B✗][C✓][D✗][E✓][  ][  ][F✓]      │
│   ↑reachable  ↑garbage                  │
│                                          │
│  AFTER SWEEP:                            │
│  [A✓][  ][C✓][  ][E✓][  ][  ][F✓]      │
│                                          │
│  AFTER COMPACT:                          │
│  [A✓][C✓][E✓][F✓][  ][  ][  ][  ]      │
└──────────────────────────────────────────┘
```

---

## TOPIC 3 — MEMORY LEAKS — Production Ka Dushman

### Memory Leak 1 — Global Variable

```javascript
// ❌ Leak — global array kabhi free nahi hogi
const leakedData = []; // Global scope

app.get('/data', (req, res) => {
    leakedData.push(new Array(1000).fill('data'));
    // Har request pe data add hota jaata hai
    // Kabhi remove nahi hota
    // Server eventually crash karega
    res.json({ count: leakedData.length });
});

// ✅ Fix
app.get('/data', (req, res) => {
    const requestData = new Array(1000).fill('data');
    // Local scope — request ke baad GC collect kar lega
    res.json({ processed: requestData.length });
});
```

### Memory Leak 2 — Closure Leak

```javascript
// ❌ Leak — large data closure mein trap ho gayi
function createLeak() {
    const largeData = new Array(1000000).fill('big data');
    
    return function() {
        // largeData use nahi ho rahi — lekin closure mein hai
        // V8 optimize kar sakta hai — but safe nahi
        console.log("Small function");
        // largeData kabhi GC nahi hogi jab tak yeh function live hai
    };
}

const leakedFunc = createLeak(); // largeData trap!

// ✅ Fix
function createClean() {
    const largeData = new Array(1000000).fill('big data');
    const summary = largeData.length; // Sirf jo chahiye woh rakho
    largeData; // Explicit — GC hint (not guaranteed but good practice)
    
    return function() {
        console.log("Length:", summary); // Large data nahi — sirf summary
    };
}
```

### Memory Leak 3 — EventEmitter Leak

```javascript
// ❌ Leak — listeners accumulate karte hain
const EventEmitter = require('events');
const emitter = new EventEmitter();

function addListener() {
    // Har baar naya listener add hota hai
    // Old listeners kabhi remove nahi hote
    emitter.on('data', (data) => {
        console.log(data);
    });
}

setInterval(addListener, 1000); // Har second listener badhta hai
// Warning: MaxListenersExceededWarning 10 ke baad

// ✅ Fix 1 — once use karo
emitter.once('data', handler); // Automatic remove after first call

// ✅ Fix 2 — manually remove karo
function handler(data) { console.log(data); }
emitter.on('data', handler);
// Jab kaam ho jaaye:
emitter.off('data', handler);

// ✅ Fix 3 — WeakRef use karo (Node.js 14+)
```

### Memory Leak 4 — Timer Leak

```javascript
// ❌ Leak — timer kabhi clear nahi hua
class DataFetcher {
    start() {
        this.timer = setInterval(() => {
            this.fetchData();
        }, 1000);
    }
    
    // ❌ stop() method nahi hai — timer hamesha chalta rehega
    // Even agar object destroy ho jaaye
}

// ✅ Fix
class DataFetcher {
    start() {
        this.timer = setInterval(() => {
            this.fetchData();
        }, 1000);
    }
    
    stop() {
        if(this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    fetchData() {
        console.log('Fetching...');
    }
}

// Production mein — graceful shutdown mein stop() call karo
process.on('SIGTERM', () => {
    fetcher.stop();
    process.exit(0);
});
```

---

## TOPIC 4 — MEMORY DEBUGGING TOOLS

### process.memoryUsage() — Real Time Monitoring

```javascript
function formatMemory(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function logMemory(label) {
    const mem = process.memoryUsage();
    console.log(`\n[${label}]`);
    console.log(`  RSS        : ${formatMemory(mem.rss)}`);
    console.log(`  Heap Total : ${formatMemory(mem.heapTotal)}`);
    console.log(`  Heap Used  : ${formatMemory(mem.heapUsed)}`);
    console.log(`  External   : ${formatMemory(mem.external)}`);
}

logMemory('Start');

// Memory use karo
const bigArray = new Array(1000000).fill({ data: 'test' });
logMemory('After allocation');

// GC hint (not guaranteed)
bigArray.length = 0;
logMemory('After clear');

// Force GC (only in debug mode: node --expose-gc app.js)
if(global.gc) {
    global.gc();
    logMemory('After GC');
}
```

### Heap Snapshot Lena

```javascript
const v8 = require('v8');
const fs = require('fs');

// Heap snapshot save karo
const snapshot = v8.writeHeapSnapshot();
console.log('Heap snapshot saved:', snapshot);

// Chrome DevTools mein open karo:
// DevTools → Memory → Load Snapshot
```

---

## PHASE 6 PROJECT — Memory Leak Detector

```javascript
// memory-monitor.js

const { performance } = require('perf_hooks');

class MemoryMonitor {
    constructor(options = {}) {
        this.interval = options.interval || 5000;
        this.threshold = options.threshold || 100; // MB
        this.snapshots = [];
        this.timer = null;
        this.alertCallback = options.onAlert || this.defaultAlert;
    }
    
    getMemoryInfo() {
        const mem = process.memoryUsage();
        return {
            timestamp: new Date().toISOString(),
            rss: (mem.rss / 1024 / 1024).toFixed(2),
            heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2),
            heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2),
            external: (mem.external / 1024 / 1024).toFixed(2),
            uptime: process.uptime().toFixed(0)
        };
    }
    
    detectLeak() {
        if(this.snapshots.length < 5) return null;
        
        const recent = this.snapshots.slice(-5);
        const trend = recent.every((snap, i) => {
            if(i === 0) return true;
            return parseFloat(snap.heapUsed) > 
                   parseFloat(recent[i-1].heapUsed);
        });
        
        if(trend) {
            const growth = parseFloat(recent[4].heapUsed) - 
                          parseFloat(recent[0].heapUsed);
            return { 
                possibleLeak: true, 
                growth: growth.toFixed(2) + ' MB',
                over: '5 snapshots'
            };
        }
        
        return null;
    }
    
    defaultAlert(info) {
        console.error('\n🚨 MEMORY ALERT!');
        console.error(`Heap used: ${info.heapUsed} MB`);
        console.error(`Threshold: ${info.threshold} MB`);
        
        if(info.leak) {
            console.error(`⚠️  Possible Memory Leak Detected!`);
            console.error(`Growth: ${info.leak.growth}`);
        }
    }
    
    start() {
        console.log('🔍 Memory Monitor started');
        console.log(`Checking every ${this.interval/1000}s`);
        console.log(`Alert threshold: ${this.threshold} MB\n`);
        
        this.timer = setInterval(() => {
            const info = this.getMemoryInfo();
            this.snapshots.push(info);
            
            // Last 20 snapshots rakhna kaafi hai
            if(this.snapshots.length > 20) {
                this.snapshots.shift();
            }
            
            console.log(
                `[${info.timestamp}] Heap: ${info.heapUsed}MB ` +
                `/ ${info.heapTotal}MB | RSS: ${info.rss}MB`
            );
            
            const leak = this.detectLeak();
            
            if(parseFloat(info.heapUsed) > this.threshold || leak) {
                this.alertCallback({
                    ...info,
                    threshold: this.threshold,
                    leak
                });
            }
            
        }, this.interval);
    }
    
    stop() {
        if(this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log('Memory Monitor stopped');
        }
    }
    
    report() {
        if(this.snapshots.length === 0) {
            console.log('No data collected yet');
            return;
        }
        
        const heapValues = this.snapshots.map(s => 
            parseFloat(s.heapUsed)
        );
        
        console.log('\n=== MEMORY REPORT ===');
        console.log(`Snapshots: ${this.snapshots.length}`);
        console.log(`Min Heap: ${Math.min(...heapValues).toFixed(2)} MB`);
        console.log(`Max Heap: ${Math.max(...heapValues).toFixed(2)} MB`);
        console.log(`Current: ${heapValues[heapValues.length-1].toFixed(2)} MB`);
        
        const leak = this.detectLeak();
        if(leak) {
            console.log(`\n⚠️  POSSIBLE LEAK: ${leak.growth} growth`);
        } else {
            console.log('\n✅ No obvious leak detected');
        }
    }
}

// Use karo
const monitor = new MemoryMonitor({
    interval: 2000,
    threshold: 200,
    onAlert: (info) => {
        console.error('\n🚨 HIGH MEMORY USAGE!', info.heapUsed, 'MB');
    }
});

monitor.start();

// Simulate memory usage
let leak = [];
setInterval(() => {
    leak.push(new Array(10000).fill('test data'));
}, 500);

// Stop after 30 seconds aur report dekho
setTimeout(() => {
    monitor.stop();
    monitor.report();
    leak = [];
}, 30000);
```

---

# ═══════════════════════════════════════════
# PHASE 7 — STREAMS & BUFFERS
# ═══════════════════════════════════════════

---

## TOPIC 1 — BUFFERS — BINARY DATA KI DUNIYA

### Story — Kyun Chahiye Buffer

JavaScript sirf Unicode strings samjhta tha — binary data nahi. Lekin networking aur file operations mein raw binary data hoti hai — images, videos, encrypted data. **Buffer** ne yeh problem solve ki — raw binary data directly memory mein store karna.

```
Without Buffer:
Binary data → String convert karo → Process karo → Wapas binary
Performance: 💀 Terrible

With Buffer:
Binary data → Directly memory mein → Process karo
Performance: 🚀 Fast
```

### Buffer Kya Hai Andar Se

Buffer ek fixed-size raw memory chunk hai — V8 Heap ke baahaar allocate hota hai — C++ level pe directly OS memory mein.

```javascript
// Buffer banana — different ways
const buf1 = Buffer.alloc(10);
// 10 bytes ka buffer — sab zeros se fill

const buf2 = Buffer.alloc(10, 1);
// 10 bytes — sab 1 se fill

const buf3 = Buffer.from('Hello Node');
// String se Buffer — UTF-8 encoding default

const buf4 = Buffer.from([72, 101, 108, 108, 111]);
// Byte array se Buffer — yeh 'Hello' hai ASCII mein

// Buffer ka content dekhna
console.log(buf3);           // <Buffer 48 65 6c 6c 6f 20 4e 6f 64 65>
console.log(buf3.toString()); // 'Hello Node'
console.log(buf3.length);     // 10 bytes
console.log(buf3[0]);         // 72 (ASCII code for 'H')
```

### Buffer Operations

```javascript
const buf = Buffer.from('Hello World');

// Specific bytes padhna
console.log(buf.slice(0, 5).toString()); // 'Hello'
console.log(buf.slice(6).toString());    // 'World'

// Buffers combine karna
const part1 = Buffer.from('Hello ');
const part2 = Buffer.from('World');
const combined = Buffer.concat([part1, part2]);
console.log(combined.toString()); // 'Hello World'

// Binary data check karna
const encrypted = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
console.log(encrypted.toString('hex'));    // '48656c6c6f'
console.log(encrypted.toString('base64')); // 'SGVsbG8='
console.log(encrypted.toString('utf8'));   // 'Hello'
```

---

## TOPIC 2 — STREAMS ARCHITECTURE

### Story — Large File Problem

Ek 10GB video file serve karni hai. Without Streams:

```javascript
// ❌ DISASTER — 10GB RAM mein load karna
fs.readFile('10gb-video.mp4', (err, data) => {
    // data = 10GB Buffer in memory
    // Server crash guaranteed on most machines
    res.end(data);
});
```

With Streams:

```javascript
// ✅ EFFICIENT — chunk by chunk bhejo
const readable = fs.createReadStream('10gb-video.mp4');
readable.pipe(res);
// Sirf ek chunk (64KB default) memory mein at a time
// Server RAM normal rehta hai
```

### Stream Types

```
┌─────────────────────────────────────────────────────────┐
│                   STREAM TYPES                          │
│                                                         │
│  Readable Stream:                                       │
│  Data padhne ke liye                                    │
│  Examples: fs.createReadStream, http.IncomingMessage    │
│  ──────────────────────────────→ data flow             │
│                                                         │
│  Writable Stream:                                       │
│  Data likhne ke liye                                    │
│  Examples: fs.createWriteStream, http.ServerResponse    │
│  ──────────────────────────────→ data flow             │
│                                                         │
│  Duplex Stream:                                         │
│  Dono — padhna aur likhna                              │
│  Examples: TCP sockets, net.Socket                      │
│  ←─────────────────────────────→ data flow             │
│                                                         │
│  Transform Stream:                                      │
│  Data padhna, transform karna, wapas likhna            │
│  Examples: zlib.createGzip, crypto streams             │
│  ──────────[TRANSFORM]──────────→ data flow            │
└─────────────────────────────────────────────────────────┘
```

---

## TOPIC 3 — READABLE STREAMS

```javascript
const fs = require('fs');

// Readable stream banana
const readStream = fs.createReadStream('large-file.txt', {
    encoding: 'utf8',
    highWaterMark: 64 * 1024  // 64KB chunks (default)
});

// Events
readStream.on('data', (chunk) => {
    // Har baar ek chunk aayega
    console.log(`Chunk received: ${chunk.length} bytes`);
    // Process karo chunk ko
});

readStream.on('end', () => {
    console.log('File completely read');
});

readStream.on('error', (err) => {
    console.error('Error:', err.message);
});

// Pause/Resume
readStream.on('data', (chunk) => {
    readStream.pause();          // Data aana rokdo
    
    setTimeout(() => {
        readStream.resume();     // Wapas shuru karo
    }, 1000);
});
```

---

## TOPIC 4 — WRITABLE STREAMS

```javascript
const fs = require('fs');

const writeStream = fs.createWriteStream('output.txt', {
    encoding: 'utf8',
    flags: 'w'  // 'w' = overwrite, 'a' = append
});

// Data likhna
writeStream.write('Line 1\n');
writeStream.write('Line 2\n');
writeStream.write('Line 3\n');
writeStream.end('Final line\n');  // end — stream close karo

writeStream.on('finish', () => {
    console.log('All data written');
});

writeStream.on('error', (err) => {
    console.error('Write error:', err.message);
});

// write() return value important hai!
const canContinue = writeStream.write(data);
if(!canContinue) {
    // Buffer full! — Backpressure signal
    // Pausing karo jab tak 'drain' event na aaye
    readStream.pause();
    writeStream.once('drain', () => {
        readStream.resume();
    });
}
```

---

## TOPIC 5 — BACKPRESSURE — Production Critical

### Kya Hai

Backpressure tab hoti hai jab data produce karne ki speed consume karne ki speed se zyada ho. Agar handle na karo — memory mein data accumulate hota rehta hai aur crash ho jaata hai.

```
Without Backpressure:
Producer: 1GB/s data produce kar raha
Consumer: 100MB/s data consume kar sakta
Result: 900MB/s memory mein accumulate → CRASH

With Backpressure:
Producer: 1GB/s try karta hai
Consumer: "Ruko! Buffer full!" signal bhejta hai
Producer: Rukta hai — drain hone ka wait karta hai
Result: Memory stable — no crash
```

```javascript
const fs = require('fs');

function copyWithBackpressure(src, dest) {
    const readable = fs.createReadStream(src);
    const writable = fs.createWriteStream(dest);
    
    readable.on('data', (chunk) => {
        // write() false return karega agar buffer full ho
        const ok = writable.write(chunk);
        
        if(!ok) {
            // Backpressure! — Readable pause karo
            console.log('Backpressure! Pausing readable...');
            readable.pause();
            
            // Writable drain hone ka wait karo
            writable.once('drain', () => {
                console.log('Drained! Resuming readable...');
                readable.resume();
            });
        }
    });
    
    readable.on('end', () => {
        writable.end();
    });
    
    writable.on('finish', () => {
        console.log('Copy complete with proper backpressure!');
    });
}

// Ya simply — pipe use karo (automatically backpressure handle karta hai)
fs.createReadStream('source.txt')
    .pipe(fs.createWriteStream('destination.txt'));
```

---

## TOPIC 6 — TRANSFORM STREAMS

```javascript
const { Transform } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Custom Transform Stream banana
class UpperCaseTransform extends Transform {
    _transform(chunk, encoding, callback) {
        // chunk = incoming data
        // callback(error, transformedData)
        const upper = chunk.toString().toUpperCase();
        callback(null, upper);
    }
    
    _flush(callback) {
        // Stream khatam hone ke pehle — last kaam
        callback(null, '\n[DONE]');
    }
}

// Use karo
fs.createReadStream('input.txt')
    .pipe(new UpperCaseTransform())  // Transform karo
    .pipe(fs.createWriteStream('output.txt'));  // Write karo

// Real world — Compression pipeline
fs.createReadStream('large-file.txt')
    .pipe(zlib.createGzip())         // Compress karo
    .pipe(fs.createWriteStream('large-file.txt.gz'));

// Decompress
fs.createReadStream('large-file.txt.gz')
    .pipe(zlib.createGunzip())
    .pipe(fs.createWriteStream('large-file-restored.txt'));
```

---

## PHASE 7 PROJECT — Streaming File Processor

```javascript
// stream-processor.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { Transform, pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

// Progress tracking Transform
class ProgressTracker extends Transform {
    constructor(totalSize, options = {}) {
        super(options);
        this.totalSize = totalSize;
        this.processedBytes = 0;
        this.startTime = Date.now();
        this.lastLog = 0;
    }
    
    _transform(chunk, encoding, callback) {
        this.processedBytes += chunk.length;
        
        const now = Date.now();
        if(now - this.lastLog > 500) {  // Log har 500ms
            const percent = ((this.processedBytes / this.totalSize) * 100).toFixed(1);
            const elapsed = (now - this.startTime) / 1000;
            const speed = (this.processedBytes / 1024 / 1024 / elapsed).toFixed(2);
            
            process.stdout.write(
                `\r Progress: ${percent}% | Speed: ${speed} MB/s | ` +
                `${(this.processedBytes/1024/1024).toFixed(2)} MB`
            );
            this.lastLog = now;
        }
        
        callback(null, chunk);
    }
    
    _flush(callback) {
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
        console.log(`\n✅ Done in ${elapsed}s`);
        callback();
    }
}

// Hash computing Transform
class HashComputer extends Transform {
    constructor(algorithm = 'sha256') {
        super();
        this.hash = crypto.createHash(algorithm);
    }
    
    _transform(chunk, encoding, callback) {
        this.hash.update(chunk);
        callback(null, chunk);  // Pass through
    }
    
    getHash() {
        return this.hash.digest('hex');
    }
}

async function processFile(inputPath, outputPath) {
    console.log(`Processing: ${path.basename(inputPath)}`);
    
    // File size nikalo
    const stats = await fs.promises.stat(inputPath);
    const totalSize = stats.size;
    
    console.log(`Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    const progress = new ProgressTracker(totalSize);
    const hashComputer = new HashComputer('sha256');
    
    // Pipeline — automatically backpressure handle karta hai
    await pipelineAsync(
        fs.createReadStream(inputPath),
        progress,
        hashComputer,
        zlib.createGzip(),
        fs.createWriteStream(outputPath)
    );
    
    const finalHash = hashComputer.getHash();
    const outputStats = await fs.promises.stat(outputPath);
    const compressionRatio = (1 - outputStats.size / totalSize) * 100;
    
    return {
        inputSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        outputSize: `${(outputStats.size / 1024 / 1024).toFixed(2)} MB`,
        compressionRatio: `${compressionRatio.toFixed(1)}%`,
        sha256: finalHash
    };
}

// Pehle ek test file banao
async function createTestFile(filename, sizeMB) {
    const writeStream = fs.createWriteStream(filename);
    const chunkSize = 64 * 1024;
    const totalChunks = (sizeMB * 1024 * 1024) / chunkSize;
    
    for(let i = 0; i < totalChunks; i++) {
        const chunk = crypto.randomBytes(chunkSize);
        if(!writeStream.write(chunk)) {
            await new Promise(resolve => writeStream.once('drain', resolve));
        }
    }
    
    await new Promise(resolve => writeStream.end(resolve));
    console.log(`Test file created: ${filename} (${sizeMB}MB)`);
}

async function main() {
    // 10MB test file banao
    await createTestFile('test-input.bin', 10);
    
    const result = await processFile('test-input.bin', 'test-output.bin.gz');
    
    console.log('\n=== PROCESSING REPORT ===');
    console.log(`Input Size      : ${result.inputSize}`);
    console.log(`Output Size     : ${result.outputSize}`);
    console.log(`Compression     : ${result.compressionRatio} saved`);
    console.log(`SHA256 Hash     : ${result.sha256}`);
    
    // Cleanup
    await fs.promises.unlink('test-input.bin');
    console.log('\nDone!');
}

main().catch(console.error);
```

---

# ═══════════════════════════════════════════
# PHASE 10 — MULTITHREADING & SCALING
# ═══════════════════════════════════════════

---

## TOPIC 1 — WORKER THREADS

### Story — CPU Bottleneck

Node.js single threaded hai — CPU-intensive kaam Event Loop block karta hai. **Worker Threads** ne solution diya — multiple threads mein JavaScript run karo — sab V8 ke apne instance ke saath.

```
Without Worker Threads:
Main Thread: [JS code] [Heavy CPU task — BLOCKING] [JS code]
                            ↑ 5 seconds — sabkuch ruka

With Worker Threads:
Main Thread:  [JS code] ──────────────────────────→ [JS code]
Worker 1:               [Heavy CPU task — chunk 1]
Worker 2:               [Heavy CPU task — chunk 2]
Worker 3:               [Heavy CPU task — chunk 3]
Worker 4:               [Heavy CPU task — chunk 4]
                        ↑ Parallel! — Main thread free
```

### Worker Threads — Complete Implementation

```javascript
// main.js
const { Worker, isMainThread, parentPort, 
        workerData } = require('worker_threads');
const os = require('os');

if(isMainThread) {
    // Main Thread code
    
    function runWorker(data) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: data
            });
            
            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if(code !== 0) {
                    reject(new Error(`Worker exited: ${code}`));
                }
            });
        });
    }
    
    async function parallelComputation() {
        const cpuCount = os.cpus().length;
        console.log(`CPUs available: ${cpuCount}`);
        
        const tasks = Array.from({ length: cpuCount }, (_, i) => ({
            id: i + 1,
            start: i * 1e6,
            end: (i + 1) * 1e6
        }));
        
        console.log(`Running ${tasks.length} workers in parallel...`);
        
        const start = Date.now();
        const results = await Promise.all(tasks.map(runWorker));
        const total = results.reduce((sum, r) => sum + r.result, 0);
        
        console.log(`Result: ${total}`);
        console.log(`Time: ${Date.now() - start}ms`);
        console.log(`(vs ~${tasks.length * 200}ms sequential)`);
    }
    
    parallelComputation();
    
} else {
    // Worker Thread code
    const { id, start, end } = workerData;
    
    let sum = 0;
    for(let i = start; i < end; i++) {
        sum += i;
    }
    
    // Main thread ko result bhejo
    parentPort.postMessage({ id, result: sum });
}
```

### SharedArrayBuffer — Threads Ke Beech Data Share Karo

```javascript
// Threads directly memory share kar sakte hain — zero copy!
const { Worker, isMainThread, workerData } = require('worker_threads');

if(isMainThread) {
    // Shared memory banana
    const sharedBuffer = new SharedArrayBuffer(4 * 4); // 4 integers
    const sharedArray = new Int32Array(sharedBuffer);
    
    // Initial values
    sharedArray[0] = 100;
    sharedArray[1] = 200;
    
    const worker = new Worker(__filename, {
        workerData: { sharedBuffer }
    });
    
    worker.on('message', (msg) => {
        if(msg === 'done') {
            console.log('After worker:');
            console.log('Index 0:', sharedArray[0]); // Worker ne change kiya
            console.log('Index 1:', sharedArray[1]);
        }
    });
    
} else {
    const { sharedBuffer } = workerData;
    const sharedArray = new Int32Array(sharedBuffer);
    
    // Worker directly shared memory modify kar sakta hai
    Atomics.add(sharedArray, 0, 50);   // sharedArray[0] += 50
    Atomics.store(sharedArray, 1, 999); // sharedArray[1] = 999
    
    parentPort.postMessage('done');
}
```

---

## TOPIC 2 — CLUSTER MODULE

### Story — Multi-Core Utilization

Single Node.js process sirf ek CPU core use karta hai. 16-core server pe — 15 cores waste. **Cluster** module ne solution diya — multiple processes spawn karo, sab same port pe listen karein, OS load distribute karega.

```
Without Cluster (4-core machine):
Core 1: [Node Process — handling all requests]
Core 2: [IDLE]
Core 3: [IDLE]
Core 4: [IDLE]

With Cluster:
Core 1: [Master Process]
Core 2: [Worker Process 1 — handling requests]
Core 3: [Worker Process 2 — handling requests]
Core 4: [Worker Process 3 — handling requests]
```

### Production Cluster Setup

```javascript
// cluster-server.js
const cluster = require('cluster');
const http = require('http');
const os = require('os');

const numCPUs = os.cpus().length;

if(cluster.isMaster) {
    console.log(`Master process: ${process.pid}`);
    console.log(`Spawning ${numCPUs} workers...`);
    
    // Workers spawn karo
    for(let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    // Worker exit hone pe replace karo
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.pid} died (${signal || code})`);
        console.log('Spawning replacement worker...');
        cluster.fork();
    });
    
    // Workers se messages receive karo
    cluster.on('message', (worker, message) => {
        console.log(`Message from worker ${worker.id}:`, message);
    });
    
} else {
    // Worker code
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end(`Hello from Worker ${process.pid}\n`);
    });
    
    server.listen(3000, () => {
        console.log(`Worker ${process.pid} started`);
        // Master ko notify karo
        process.send({ worker: process.pid, status: 'ready' });
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        server.close(() => {
            process.exit(0);
        });
    });
}
```

### Worker Threads vs Cluster — Kab Kya Use Karein

```
Worker Threads:
✅ CPU-intensive computation
✅ Same memory share karna zaroori hai
✅ Single process architecture maintain karna
✅ Image/video processing
✅ Machine learning inference
Example: Ek request pe complex calculation

Cluster:
✅ HTTP server multi-core scaling
✅ Zyada requests handle karna
✅ Process isolation chahiye
✅ Memory leak ek worker ko affect kare — baki theek rahe
Example: Production web server
```

---

## TOPIC 3 — PM2 — Production Process Manager

```bash
# Install
npm install -g pm2

# Basic start
pm2 start app.js

# Cluster mode — sab CPUs use karo
pm2 start app.js -i max  
# max = CPU count automatically

# Named app
pm2 start app.js --name "my-api" -i max

# Watch mode (development)
pm2 start app.js --watch

# Logs
pm2 logs
pm2 logs my-api

# Monitoring
pm2 monit

# Process list
pm2 list

# Restart
pm2 restart my-api

# Graceful reload (zero downtime)
pm2 reload my-api

# Stop
pm2 stop my-api

# Delete
pm2 delete my-api

# Startup script (server restart pe auto-start)
pm2 startup
pm2 save
```

### PM2 Ecosystem Config

```javascript
// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: 'api-server',
            script: 'src/app.js',
            instances: 'max',      // All CPU cores
            exec_mode: 'cluster',  // Cluster mode
            
            env: {
                NODE_ENV: 'development',
                PORT: 3000
            },
            
            env_production: {
                NODE_ENV: 'production',
                PORT: 80,
                UV_THREADPOOL_SIZE: 16
            },
            
            // Memory limit — exceed hone pe restart
            max_memory_restart: '500M',
            
            // Crash pe restart
            restart_delay: 3000,
            max_restarts: 10,
            
            // Logs
            error_file: './logs/error.log',
            out_file: './logs/out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            
            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 3000
        }
    ]
};

// Production deploy:
// pm2 start ecosystem.config.js --env production
```

---

## PHASE 10 PROJECT — Auto-Scaling Worker Pool

```javascript
// worker-pool.js
const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');

class WorkerPool {
    constructor(workerScript, options = {}) {
        this.workerScript = workerScript;
        this.minWorkers = options.min || 2;
        this.maxWorkers = options.max || os.cpus().length;
        this.workers = [];
        this.queue = [];
        this.activeCount = 0;
        
        // Min workers se shuru karo
        for(let i = 0; i < this.minWorkers; i++) {
            this.addWorker();
        }
    }
    
    addWorker() {
        if(this.workers.length >= this.maxWorkers) return;
        
        const worker = new Worker(this.workerScript);
        const workerInfo = {
            worker,
            busy: false,
            id: this.workers.length + 1,
            tasksCompleted: 0
        };
        
        this.workers.push(workerInfo);
        
        worker.on('message', (result) => {
            workerInfo.busy = false;
            workerInfo.tasksCompleted++;
            this.activeCount--;
            
            if(result._resolve) {
                result._resolve(result.data);
            }
            
            // Queue mein kuch hai?
            this.processQueue();
        });
        
        worker.on('error', (err) => {
            console.error(`Worker ${workerInfo.id} error:`, err);
            workerInfo.busy = false;
            this.activeCount--;
            
            // Worker replace karo
            this.workers = this.workers.filter(w => w !== workerInfo);
            this.addWorker();
            this.processQueue();
        });
        
        return workerInfo;
    }
    
    getFreeWorker() {
        return this.workers.find(w => !w.busy);
    }
    
    processQueue() {
        if(this.queue.length === 0) return;
        
        let worker = this.getFreeWorker();
        
        // No free worker — scale up?
        if(!worker && this.workers.length < this.maxWorkers) {
            worker = this.addWorker();
        }
        
        if(!worker) return;
        
        const { task, resolve, reject } = this.queue.shift();
        this.runTask(worker, task, resolve, reject);
    }
    
    runTask(workerInfo, task, resolve, reject) {
        workerInfo.busy = true;
        this.activeCount++;
        
        workerInfo.worker.postMessage({ task, _id: Date.now() });
        
        const handler = (result) => {
            if(result._id === task._id) {
                resolve(result.data);
            }
        };
        
        workerInfo.worker.once('message', (result) => {
            resolve(result);
        });
    }
    
    run(task) {
        return new Promise((resolve, reject) => {
            const freeWorker = this.getFreeWorker();
            
            if(freeWorker) {
                freeWorker.busy = true;
                this.activeCount++;
                
                freeWorker.worker.once('message', (result) => {
                    freeWorker.busy = false;
                    freeWorker.tasksCompleted++;
                    this.activeCount--;
                    resolve(result);
                    this.processQueue();
                });
                
                freeWorker.worker.postMessage(task);
            } else {
                this.queue.push({ task, resolve, reject });
            }
        });
    }
    
    stats() {
        return {
            totalWorkers: this.workers.length,
            activeWorkers: this.activeCount,
            queueLength: this.queue.length,
            tasksCompleted: this.workers.reduce(
                (sum, w) => sum + w.tasksCompleted, 0
            )
        };
    }
    
    async destroy() {
        await Promise.all(
            this.workers.map(w => w.worker.terminate())
        );
        this.workers = [];
        console.log('Worker pool destroyed');
    }
}

module.exports = WorkerPool;
```

---

# ═══════════════════════════════════════════
# PHASE 11 — PERFORMANCE ENGINEERING
# ═══════════════════════════════════════════

---

## TOPIC 1 — EVENT LOOP LAG

### Kya Hai

Event Loop Lag (ya Event Loop Delay) — time hai jo ek scheduled callback ko actually execute hone mein lagta hai. Ideal mein 0ms hona chahiye — reality mein agar Event Loop busy hai toh zyada hoga.

```javascript
const { monitorEventLoopDelay } = require('perf_hooks');

// Built-in Event Loop monitor
const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();

setInterval(() => {
    console.log('Event Loop Delay Stats:');
    console.log(`  Min   : ${(h.min / 1e6).toFixed(2)}ms`);
    console.log(`  Max   : ${(h.max / 1e6).toFixed(2)}ms`);
    console.log(`  Mean  : ${(h.mean / 1e6).toFixed(2)}ms`);
    console.log(`  StdDev: ${(h.stddev / 1e6).toFixed(2)}ms`);
    h.reset();
}, 3000);

// Manual measurement
let lastCheck = Date.now();

setInterval(() => {
    const now = Date.now();
    const delay = now - lastCheck - 1000; // Expected 1000ms
    
    if(delay > 50) {
        console.warn(`⚠️  Event Loop lag: ${delay}ms`);
    }
    
    lastCheck = now;
}, 1000);
```

---

## TOPIC 2 — PERFORMANCE HOOKS

```javascript
const { performance, PerformanceObserver } = require('perf_hooks');

// Performance Observer setup
const obs = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
    });
});

obs.observe({ entryTypes: ['measure', 'function'] });

// Code measure karo
performance.mark('operation-start');

// Kuch heavy kaam
let sum = 0;
for(let i = 0; i < 1e7; i++) sum += i;

performance.mark('operation-end');
performance.measure('my-operation', 'operation-start', 'operation-end');

// Function wrapping
const timedFunction = performance.timerify(function myFunction() {
    let x = 0;
    for(let i = 0; i < 1e6; i++) x += i;
    return x;
});

timedFunction(); // Automatically measured

// Async operation measure
async function measuredAsync() {
    performance.mark('async-start');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    performance.mark('async-end');
    performance.measure('async-operation', 'async-start', 'async-end');
}

measuredAsync();
```

---

## TOPIC 3 — CPU PROFILING

```bash
# CPU Profile generate karo
node --prof app.js

# Profile analyze karo
node --prof-process isolate-*.log > profile.txt

# Readable output
node --prof-process --preprocess -j isolate-*.log | 
  node_modules/.bin/flamebearer > flamegraph.html
```

```javascript
// Code mein profiling
const v8Profiler = require('v8-profiler-next');

// CPU profile start karo
v8Profiler.startProfiling('my-profile', true);

// Kuch heavy kaam karo
heavyOperation();

// Profile stop karo aur save karo
const profile = v8Profiler.stopProfiling('my-profile');
profile.export((error, result) => {
    require('fs').writeFileSync('profile.cpuprofile', result);
    profile.delete();
    console.log('Profile saved! Open in Chrome DevTools');
});
```

---

## TOPIC 4 — CACHING STRATEGIES

```javascript
// Simple in-memory cache
class Cache {
    constructor(options = {}) {
        this.store = new Map();
        this.maxSize = options.maxSize || 1000;
        this.ttl = options.ttl || 60 * 1000; // 1 minute default
        this.hits = 0;
        this.misses = 0;
    }
    
    set(key, value, ttl = this.ttl) {
        // Size limit check
        if(this.store.size >= this.maxSize) {
            // LRU — oldest entry hatao
            const firstKey = this.store.keys().next().value;
            this.store.delete(firstKey);
        }
        
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttl,
            accessCount: 0
        });
    }
    
    get(key) {
        const entry = this.store.get(key);
        
        if(!entry) {
            this.misses++;
            return null;
        }
        
        if(Date.now() > entry.expiresAt) {
            this.store.delete(key);
            this.misses++;
            return null;
        }
        
        entry.accessCount++;
        this.hits++;
        return entry.value;
    }
    
    stats() {
        const total = this.hits + this.misses;
        return {
            size: this.store.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total ? `${((this.hits/total)*100).toFixed(1)}%` : '0%'
        };
    }
}

// Use in HTTP server
const cache = new Cache({ ttl: 5 * 60 * 1000 }); // 5 min

async function getCachedData(key, fetchFn) {
    const cached = cache.get(key);
    if(cached) return cached;
    
    const data = await fetchFn();
    cache.set(key, data);
    return data;
}
```

---

## PHASE 11 PROJECT — Performance Benchmark Suite

```javascript
// benchmark.js
const { performance } = require('perf_hooks');

class Benchmark {
    constructor(name, options = {}) {
        this.name = name;
        this.iterations = options.iterations || 1000;
        this.warmup = options.warmup || 100;
        this.results = [];
    }
    
    async run(fn) {
        console.log(`\n📊 Benchmark: ${this.name}`);
        console.log(`Iterations: ${this.iterations}, Warmup: ${this.warmup}`);
        
        // Warmup phase
        for(let i = 0; i < this.warmup; i++) {
            await fn();
        }
        
        // Actual benchmark
        for(let i = 0; i < this.iterations; i++) {
            const start = performance.now();
            await fn();
            this.results.push(performance.now() - start);
        }
        
        this.report();
    }
    
    report() {
        const sorted = [...this.results].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        const mean = sum / sorted.length;
        const variance = sorted.reduce((acc, val) => 
            acc + Math.pow(val - mean, 2), 0) / sorted.length;
        const stddev = Math.sqrt(variance);
        
        console.log(`\n  Mean   : ${mean.toFixed(4)}ms`);
        console.log(`  Median : ${sorted[Math.floor(sorted.length/2)].toFixed(4)}ms`);
        console.log(`  Min    : ${sorted[0].toFixed(4)}ms`);
        console.log(`  Max    : ${sorted[sorted.length-1].toFixed(4)}ms`);
        console.log(`  StdDev : ${stddev.toFixed(4)}ms`);
        console.log(`  p95    : ${sorted[Math.floor(sorted.length*0.95)].toFixed(4)}ms`);
        console.log(`  p99    : ${sorted[Math.floor(sorted.length*0.99)].toFixed(4)}ms`);
        console.log(`  Ops/sec: ${(1000/mean).toFixed(0)}`);
    }
}

async function runSuite() {
    // Benchmark 1 — JSON parse
    const b1 = new Benchmark('JSON.parse large object');
    const largeObj = JSON.stringify(
        Array.from({length: 1000}, (_, i) => ({
            id: i, name: `User ${i}`, data: 'x'.repeat(100)
        }))
    );
    await b1.run(() => JSON.parse(largeObj));
    
    // Benchmark 2 — Array operations
    const b2 = new Benchmark('Array.map + filter');
    const arr = Array.from({length: 10000}, (_, i) => i);
    await b2.run(() => {
        arr.map(x => x * 2).filter(x => x % 3 === 0);
    });
    
    // Benchmark 3 — String concatenation vs join
    const b3 = new Benchmark('String join (efficient)');
    const parts = Array.from({length: 1000}, (_, i) => `part${i}`);
    await b3.run(() => parts.join(''));
    
    const b4 = new Benchmark('String += (inefficient)');
    await b4.run(() => {
        let str = '';
        for(const part of parts) str += part;
        return str;
    });
}

runSuite().catch(console.error);
```

---

# ═══════════════════════════════════════════
# PHASE 12 — PRODUCTION NODE.JS
# ═══════════════════════════════════════════

---

## TOPIC 1 — LOGGING SYSTEM

### Production Grade Logger

```javascript
// logger.js
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.logDir = options.logDir || './logs';
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
        
        this.levels = {
            error: 0, warn: 1, info: 2, 
            http: 3, debug: 4
        };
        
        this.colors = {
            error: '\x1b[31m',  // Red
            warn:  '\x1b[33m',  // Yellow
            info:  '\x1b[36m',  // Cyan
            http:  '\x1b[35m',  // Magenta
            debug: '\x1b[32m',  // Green
            reset: '\x1b[0m'
        };
        
        this.ensureLogDir();
    }
    
    ensureLogDir() {
        if(!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    
    formatMessage(level, message, meta = {}) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            pid: process.pid,
            ...meta
        });
    }
    
    writeToFile(level, formatted) {
        const filename = path.join(this.logDir, `${level}.log`);
        fs.appendFileSync(filename, formatted + '\n');
    }
    
    log(level, message, meta = {}) {
        if(this.levels[level] > this.levels[this.level]) return;
        
        const formatted = this.formatMessage(level, message, meta);
        
        // Console output with color
        const color = this.colors[level] || '';
        const reset = this.colors.reset;
        console.log(`${color}${formatted}${reset}`);
        
        // File output
        this.writeToFile(level, formatted);
        
        // Error level → also write to combined error log
        if(level === 'error') {
            this.writeToFile('combined', formatted);
        }
    }
    
    error(message, meta) { this.log('error', message, meta); }
    warn(message, meta)  { this.log('warn', message, meta); }
    info(message, meta)  { this.log('info', message, meta); }
    http(message, meta)  { this.log('http', message, meta); }
    debug(message, meta) { this.log('debug', message, meta); }
    
    // HTTP Request logger middleware
    requestLogger() {
        return (req, res, next) => {
            const start = performance.now();
            const requestId = Math.random().toString(36).substr(2, 9);
            
            req.requestId = requestId;
            
            res.on('finish', () => {
                const duration = performance.now() - start;
                this.http(`${req.method} ${req.url}`, {
                    requestId,
                    statusCode: res.statusCode,
                    duration: `${duration.toFixed(2)}ms`,
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                });
            });
            
            next();
        };
    }
}

module.exports = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    logDir: './logs'
});
```

---

## TOPIC 2 — ERROR HANDLING ARCHITECTURE

```javascript
// errors.js — Custom Error Classes

class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;  // Expected errors
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, field) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} nahi mila`, 404, 'NOT_FOUND');
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

class RateLimitError extends AppError {
    constructor(retryAfter) {
        super('Too many requests', 429, 'RATE_LIMIT');
        this.retryAfter = retryAfter;
    }
}

// Global Error Handler
function errorHandler(err, req, res, next) {
    const logger = require('./logger');
    
    // Operational errors — expected, controlled
    if(err.isOperational) {
        logger.warn('Operational error', {
            code: err.code,
            message: err.message,
            requestId: req.requestId,
            path: req.path
        });
        
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                ...(err.field && { field: err.field }),
                ...(err.retryAfter && { retryAfter: err.retryAfter })
            }
        });
    }
    
    // Programming errors — unexpected, serious
    logger.error('Unexpected error!', {
        message: err.message,
        stack: err.stack,
        requestId: req.requestId
    });
    
    // Production mein internal details hide karo
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message
        }
    });
}

module.exports = { 
    AppError, ValidationError, NotFoundError, 
    UnauthorizedError, RateLimitError, errorHandler 
};
```

---

## TOPIC 3 — GRACEFUL SHUTDOWN

```javascript
// graceful-shutdown.js

class GracefulShutdown {
    constructor(server, options = {}) {
        this.server = server;
        this.timeout = options.timeout || 30000; // 30 seconds
        this.logger = options.logger || console;
        this.cleanupTasks = [];
        
        this.setupHandlers();
    }
    
    addCleanupTask(name, fn) {
        this.cleanupTasks.push({ name, fn });
    }
    
    setupHandlers() {
        ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
            process.on(signal, () => {
                this.logger.info(`${signal} received — shutting down`);
                this.shutdown();
            });
        });
        
        process.on('uncaughtException', (err) => {
            this.logger.error('Uncaught Exception!', {
                message: err.message,
                stack: err.stack
            });
            this.shutdown(1);
        });
        
        process.on('unhandledRejection', (reason) => {
            this.logger.error('Unhandled Rejection!', { reason });
            this.shutdown(1);
        });
    }
    
    async shutdown(code = 0) {
        this.logger.info('Starting graceful shutdown...');
        
        // Timeout ke baad force exit
        const forceExit = setTimeout(() => {
            this.logger.error('Forced shutdown — timeout exceeded');
            process.exit(1);
        }, this.timeout);
        
        forceExit.unref(); // Timeout khud exit block na kare
        
        try {
            // New connections accept karna band karo
            await new Promise((resolve) => {
                this.server.close(resolve);
            });
            this.logger.info('Server closed — no new connections');
            
            // Cleanup tasks run karo
            for(const task of this.cleanupTasks) {
                this.logger.info(`Running cleanup: ${task.name}`);
                await task.fn();
            }
            
            this.logger.info('Graceful shutdown complete');
            clearTimeout(forceExit);
            process.exit(code);
            
        } catch(err) {
            this.logger.error('Shutdown error:', err.message);
            process.exit(1);
        }
    }
}

// Use karo
const http = require('http');
const server = http.createServer(app);

const shutdown = new GracefulShutdown(server, {
    timeout: 30000,
    logger: require('./logger')
});

// DB connection cleanup
shutdown.addCleanupTask('Database', async () => {
    await db.disconnect();
    console.log('DB disconnected');
});

// Redis cleanup  
shutdown.addCleanupTask('Redis', async () => {
    await redis.quit();
    console.log('Redis disconnected');
});

server.listen(3000);
```

---

## TOPIC 4 — RATE LIMITING

```javascript
// rate-limiter.js

class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 min
        this.max = options.max || 100;
        this.store = new Map();
        
        // Cleanup old entries har minute
        setInterval(() => this.cleanup(), 60 * 1000).unref();
    }
    
    getKey(req) {
        return req.ip || req.connection.remoteAddress;
    }
    
    cleanup() {
        const now = Date.now();
        for(const [key, data] of this.store.entries()) {
            if(now > data.resetTime) {
                this.store.delete(key);
            }
        }
    }
    
    middleware() {
        return (req, res, next) => {
            const key = this.getKey(req);
            const now = Date.now();
            
            let entry = this.store.get(key);
            
            if(!entry || now > entry.resetTime) {
                entry = {
                    count: 0,
                    resetTime: now + this.windowMs
                };
                this.store.set(key, entry);
            }
            
            entry.count++;
            
            // Headers set karo
            res.setHeader('X-RateLimit-Limit', this.max);
            res.setHeader('X-RateLimit-Remaining', 
                Math.max(0, this.max - entry.count));
            res.setHeader('X-RateLimit-Reset', 
                Math.ceil(entry.resetTime / 1000));
            
            if(entry.count > this.max) {
                const retryAfter = Math.ceil(
                    (entry.resetTime - now) / 1000
                );
                res.setHeader('Retry-After', retryAfter);
                
                return res.status(429).json({
                    error: 'Too Many Requests',
                    retryAfter
                });
            }
            
            next();
        };
    }
}

// Use karo
const limiter = new RateLimiter({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100                     // 100 requests per window
});

app.use('/api', limiter.middleware());
```

---

## TOPIC 5 — JWT AUTHENTICATION

```javascript
// auth.js
const crypto = require('crypto');

class JWT {
    constructor(secret) {
        this.secret = secret;
    }
    
    base64UrlEncode(data) {
        return Buffer.from(JSON.stringify(data))
            .toString('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }
    
    sign(payload, expiresIn = '1h') {
        const header = { alg: 'HS256', typ: 'JWT' };
        
        // Expiration calculate karo
        const exp = Math.floor(Date.now() / 1000) + 
            this.parseExpiry(expiresIn);
        
        const fullPayload = { ...payload, exp, iat: Math.floor(Date.now()/1000) };
        
        const headerEncoded = this.base64UrlEncode(header);
        const payloadEncoded = this.base64UrlEncode(fullPayload);
        
        const signature = crypto
            .createHmac('sha256', this.secret)
            .update(`${headerEncoded}.${payloadEncoded}`)
            .digest('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        
        return `${headerEncoded}.${payloadEncoded}.${signature}`;
    }
    
    verify(token) {
        const parts = token.split('.');
        if(parts.length !== 3) throw new Error('Invalid token format');
        
        const [headerB64, payloadB64, signature] = parts;
        
        // Signature verify karo
        const expectedSig = crypto
            .createHmac('sha256', this.secret)
            .update(`${headerB64}.${payloadB64}`)
            .digest('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
        
        if(signature !== expectedSig) {
            throw new Error('Invalid signature');
        }
        
        // Payload decode karo
        const payload = JSON.parse(
            Buffer.from(payloadB64, 'base64').toString('utf8')
        );
        
        // Expiration check karo
        if(payload.exp && Date.now() / 1000 > payload.exp) {
            throw new Error('Token expired');
        }
        
        return payload;
    }
    
    parseExpiry(expiresIn) {
        const units = { s: 1, m: 60, h: 3600, d: 86400 };
        const match = expiresIn.match(/(\d+)([smhd])/);
        if(!match) return 3600; // Default 1 hour
        return parseInt(match[1]) * (units[match[2]] || 1);
    }
    
    // Express middleware
    authenticate() {
        return (req, res, next) => {
            const authHeader = req.headers.authorization;
            
            if(!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ 
                    error: 'Authorization header required' 
                });
            }
            
            const token = authHeader.split(' ')[1];
            
            try {
                req.user = this.verify(token);
                next();
            } catch(err) {
                res.status(401).json({ error: err.message });
            }
        };
    }
}

module.exports = new JWT(process.env.JWT_SECRET || 'default-secret');
```

---

## PHASE 12 — COMPLETE PRODUCTION SERVER

```javascript
// production-app.js

const http = require('http');
const url = require('url');
const logger = require('./logger');
const { errorHandler, ValidationError, 
        NotFoundError, UnauthorizedError } = require('./errors');
const RateLimiter = require('./rate-limiter');
const jwt = require('./auth');
const { GracefulShutdown } = require('./graceful-shutdown');

// ── In-Memory Database ──────────────────────────────────
const db = {
    users: [
        { id: 1, name: 'Aryan', email: 'aryan@test.com', role: 'admin' },
        { id: 2, name: 'Rahul', email: 'rahul@test.com', role: 'user' }
    ],
    nextId: 3
};

// ── Utilities ───────────────────────────────────────────
const limiter = new RateLimiter({ windowMs: 60000, max: 60 });

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if(body.length > 1e6) {
                req.destroy();
                reject(new ValidationError('Body too large'));
            }
        });
        req.on('end', () => {
            if(!body) return resolve({});
            try { resolve(JSON.parse(body)); }
            catch { reject(new ValidationError('Invalid JSON')); }
        });
        req.on('error', reject);
    });
}

function sendJSON(res, status, data) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'X-Powered-By': 'Pure Node.js'
    });
    res.end(JSON.stringify(data, null, 2));
}

function matchRoute(method, pathname) {
    const patterns = [
        { pattern: /^\/health$/, method: 'GET', handler: handleHealth },
        { pattern: /^\/auth\/login$/, method: 'POST', handler: handleLogin },
        { pattern: /^\/api\/users$/, method: 'GET', handler: getUsers, auth: true },
        { pattern: /^\/api\/users$/, method: 'POST', handler: createUser, auth: true },
        { pattern: /^\/api\/users\/(\d+)$/, method: 'GET', handler: getUser, auth: true },
        { pattern: /^\/api\/users\/(\d+)$/, method: 'DELETE', handler: deleteUser, auth: true }
    ];
    
    for(const route of patterns) {
        const match = pathname.match(route.pattern);
        if(match && route.method === method) {
            return { handler: route.handler, params: match.slice(1), auth: route.auth };
        }
    }
    return null;
}

// ── Handlers ────────────────────────────────────────────
async function handleHealth(req, res) {
    sendJSON(res, 200, {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
}

async function handleLogin(req, res) {
    const body = await parseBody(req);
    
    if(!body.email || !body.password) {
        throw new ValidationError('Email aur password required');
    }
    
    const user = db.users.find(u => u.email === body.email);
    if(!user || body.password !== 'password123') {
        throw new UnauthorizedError('Invalid credentials');
    }
    
    const token = jwt.sign({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
    }, '24h');
    
    sendJSON(res, 200, { token, user: { id: user.id, name: user.name } });
}

async function getUsers(req, res) {
    sendJSON(res, 200, { users: db.users, total: db.users.length });
}

async function createUser(req, res) {
    const body = await parseBody(req);
    
    if(!body.name) throw new ValidationError('Name required', 'name');
    if(!body.email) throw new ValidationError('Email required', 'email');
    
    const exists = db.users.find(u => u.email === body.email);
    if(exists) throw new ValidationError('Email already exists', 'email');
    
    const user = {
        id: db.nextId++,
        name: body.name,
        email: body.email,
        role: 'user',
        createdAt: new Date().toISOString()
    };
    
    db.users.push(user);
    sendJSON(res, 201, user);
}

async function getUser(req, res, params) {
    const user = db.users.find(u => u.id === parseInt(params[0]));
    if(!user) throw new NotFoundError('User');
    sendJSON(res, 200, user);
}

async function deleteUser(req, res, params) {
    const idx = db.users.findIndex(u => u.id === parseInt(params[0]));
    if(idx === -1) throw new NotFoundError('User');
    
    db.users.splice(idx, 1);
    res.writeHead(204);
    res.end();
}

// ── Main Server ──────────────────────────────────────────
const server = http.createServer(async (req, res) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID ? crypto.randomUUID() : 
        Math.random().toString(36).substr(2);
    
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { pathname } = url.parse(req.url);
    
    // Rate limiting
    const limited = checkRateLimit(req, res);
    if(limited) return;
    
    try {
        const route = matchRoute(req.method, pathname);
        
        if(!route) {
            throw new NotFoundError(`Route ${pathname}`);
        }
        
        // Auth check
        if(route.auth) {
            const authHeader = req.headers.authorization;
            if(!authHeader?.startsWith('Bearer ')) {
                throw new UnauthorizedError();
            }
            const token = authHeader.split(' ')[1];
            req.user = jwt.verify(token);
        }
        
        await route.handler(req, res, route.params);
        
    } catch(err) {
        errorHandler(err, req, res);
    }
    
    logger.http(`${req.method} ${pathname}`, {
        requestId,
        status: res.statusCode,
        duration: `${Date.now() - startTime}ms`
    });
});

// Rate limit check helper
const rateLimits = new Map();
function checkRateLimit(req, res) {
    const key = req.socket.remoteAddress;
    const now = Date.now();
    const window = 60000;
    const max = 60;
    
    let entry = rateLimits.get(key);
    if(!entry || now > entry.reset) {
        entry = { count: 0, reset: now + window };
        rateLimits.set(key, entry);
    }
    
    entry.count++;
    
    if(entry.count > max) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Too Many Requests' }));
        return true;
    }
    return false;
}

// ── Start ────────────────────────────────────────────────
const shutdown = new GracefulShutdown(server);

server.listen(3000, () => {
    logger.info('🚀 Production server running', { port: 3000 });
    logger.info('Endpoints:', {
        health: 'GET /health',
        login: 'POST /auth/login',
        users: 'GET /api/users (auth required)',
        createUser: 'POST /api/users (auth required)'
    });
});
```

---

# ═══════════════════════════════════════════
# PHASE 13 — ADVANCED NODE.JS INTERNALS
# ═══════════════════════════════════════════

---

## TOPIC 1 — ASYNC HOOKS

### Kya Hai

Async Hooks ek powerful API hai jo track karta hai async operations ka lifecycle — kab create hua, kab execute hua, kab destroy hua. Ye debugging, monitoring, aur request context tracking ke liye use hota hai.

```javascript
const async_hooks = require('async_hooks');
const fs = require('fs');

// Har async operation ka ek unique asyncId hota hai
const hook = async_hooks.createHook({
    init(asyncId, type, triggerAsyncId, resource) {
        // Naya async operation create hua
        fs.writeSync(
            1, // stdout
            `INIT: asyncId=${asyncId} type=${type} ` +
            `triggerAsyncId=${triggerAsyncId}\n`
        );
    },
    
    before(asyncId) {
        // Async operation execute hone wali hai
        fs.writeSync(1, `BEFORE: asyncId=${asyncId}\n`);
    },
    
    after(asyncId) {
        // Async operation execute ho gayi
        fs.writeSync(1, `AFTER: asyncId=${asyncId}\n`);
    },
    
    destroy(asyncId) {
        // Async operation cleanup
        fs.writeSync(1, `DESTROY: asyncId=${asyncId}\n`);
    }
});

hook.enable();

// Ek async operation karo
setTimeout(() => {
    console.log('Timer executed');
}, 100);

// Note: console.log Async Hooks ke saath use nahi kar sakte
// Kyunki console.log khud async hai — infinite loop
// Isliye fs.writeSync use karte hain
```

---

## TOPIC 2 — ASYNCLOCALSTORAGE — Request Context Tracking

### Story — Request ID Across Async Operations

Production mein ek problem hoti hai — ek request kai async operations karta hai. Logs mein sab interleave ho jaate hain — kounsa log kaunsi request ka hai pata nahi chalta.

**AsyncLocalStorage** ise solve karta hai — ek "context" attach karo request ke saath — sab async operations mein automatically available hoga.

```javascript
const { AsyncLocalStorage } = require('async_hooks');
const http = require('http');

// Global storage
const requestStorage = new AsyncLocalStorage();

// Logger jo automatically requestId include karta hai
const logger = {
    info(message, data = {}) {
        const context = requestStorage.getStore();
        const entry = {
            level: 'info',
            message,
            requestId: context?.requestId || 'no-context',
            userId: context?.userId,
            timestamp: new Date().toISOString(),
            ...data
        };
        console.log(JSON.stringify(entry));
    }
};

// Database operations (simulated)
async function getUserFromDB(userId) {
    await new Promise(resolve => setTimeout(resolve, 50));
    logger.info('DB query executed', { table: 'users', userId });
    return { id: userId, name: 'Aryan' };
}

async function getOrdersFromDB(userId) {
    await new Promise(resolve => setTimeout(resolve, 30));
    logger.info('DB query executed', { table: 'orders', userId });
    return [{ id: 1, total: 500 }];
}

// Server
http.createServer(async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    const userId = req.headers['x-user-id'] || '1';
    
    // Request context set karo — sab child async ops ko milega
    await requestStorage.run({ requestId, userId }, async () => {
        logger.info('Request received', { 
            method: req.method, 
            url: req.url 
        });
        
        try {
            const user = await getUserFromDB(userId);
            const orders = await getOrdersFromDB(userId);
            
            logger.info('Request completed successfully');
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ user, orders }));
            
        } catch(err) {
            logger.info('Request failed', { error: err.message });
            res.writeHead(500);
            res.end('Error');
        }
    });
    
}).listen(3000);

// Ab sab logs mein same requestId hoga ek request ke liye
// Multiple concurrent requests alag alag requestId rakhenge
```

---

## TOPIC 3 — V8 OPTIMIZATION — Hidden Classes

### Kya Hai Hidden Classes

V8 JavaScript objects ko optimize karne ke liye **Hidden Classes** use karta hai. Yeh C++ structs ki tarah hote hain — fixed layout memory mein.

```javascript
// V8 ek hidden class banata hai jab object banta hai

// ✅ GOOD — Same shape maintain karo
function Point(x, y) {
    this.x = x;  // Hidden class C0 → C1 (add x)
    this.y = y;  // Hidden class C1 → C2 (add y)
}

const p1 = new Point(1, 2); // Hidden class C2
const p2 = new Point(3, 4); // Hidden class C2 — SAME!
// V8 same class reuse karta hai — fast memory access

// ❌ BAD — Shape change karo
const obj1 = {};
obj1.x = 1;  // Hidden class C0 → C1
obj1.y = 2;  // Hidden class C1 → C2

const obj2 = {};
obj2.y = 1;  // Hidden class C0 → C3 (y pehle!)
obj2.x = 2;  // Hidden class C3 → C4

// obj1 aur obj2 alag hidden classes hain
// V8 optimize nahi kar sakta

// ❌ BAD — Property baad mein add karna
function Vehicle(make) {
    this.make = make;
}
const car = new Vehicle('Toyota');
car.model = 'Camry'; // Hidden class change! Deoptimization
```

---

## TOPIC 4 — DIAGNOSTICS CHANNEL

```javascript
const diagnostics_channel = require('diagnostics_channel');

// Channel banana
const channel = diagnostics_channel.channel('my-app:request');

// Subscribe karo (monitoring tools ye karte hain)
diagnostics_channel.subscribe('my-app:request', (message, name) => {
    console.log(`[${name}]`, message);
});

// Publish karo
channel.publish({
    type: 'start',
    requestId: '123',
    url: '/api/users'
});

// Built-in Node.js channels
diagnostics_channel.subscribe('http.client.request.start', (msg) => {
    console.log('HTTP request starting:', msg.request.path);
});
```

---

## TOPIC 5 — NODE.JS STARTUP LIFECYCLE

### Complete Startup Process

```
Node.js binary run hua
        ↓
1. Platform initialization (OS-specific setup)
        ↓
2. Libuv initialization
        ↓
3. V8 initialization
        ↓
4. Node.js bootstrap (lib/internal/bootstrap/*)
        ↓
5. Built-in modules register (fs, http, crypto...)
        ↓
6. process object setup
        ↓
7. Main module load (tera app.js)
        ↓
8. require() chain execute
        ↓
9. Top-level code execute
        ↓
10. Event Loop start
        ↓
11. Event Loop running (jab tak koi pending work hai)
        ↓
12. process.exit() ya work khatam
        ↓
13. 'exit' event fire
        ↓
14. Process terminate
```

```javascript
// Startup timing measure karo
const startTime = process.hrtime.bigint();

process.on('exit', () => {
    const elapsed = Number(process.hrtime.bigint() - startTime) / 1e6;
    console.log(`Process lifetime: ${elapsed.toFixed(2)}ms`);
});

// Module load time measure
const Module = require('module');
const originalLoad = Module._load;

Module._load = function(request, ...args) {
    const start = process.hrtime.bigint();
    const result = originalLoad.call(this, request, ...args);
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
    
    if(elapsed > 5) { // 5ms se zyada wale log karo
        console.log(`Slow module load: ${request} (${elapsed.toFixed(2)}ms)`);
    }
    
    return result;
};
```

---

# ═══════════════════════════════════════════
# PHASE 14 — REAL SENIOR ENGINEERING
# ═══════════════════════════════════════════

---

## TOPIC 1 — SCALABLE API DESIGN

### API Design Principles — Senior Level

```javascript
// Versioning
// ✅ URL versioning
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// ✅ Header versioning
app.use((req, res, next) => {
    const version = req.headers['api-version'] || 'v1';
    req.apiVersion = version;
    next();
});

// Pagination — Cursor based (production grade)
async function getUsers(req, res) {
    const { cursor, limit = 20 } = req.query;
    
    let query = db.users;
    
    if(cursor) {
        const decodedCursor = Buffer.from(cursor, 'base64').toString();
        const { id } = JSON.parse(decodedCursor);
        query = query.filter(u => u.id > id);
    }
    
    const users = query.slice(0, parseInt(limit) + 1);
    const hasNext = users.length > limit;
    const data = hasNext ? users.slice(0, -1) : users;
    
    let nextCursor = null;
    if(hasNext && data.length > 0) {
        const lastUser = data[data.length - 1];
        nextCursor = Buffer.from(
            JSON.stringify({ id: lastUser.id })
        ).toString('base64');
    }
    
    res.json({
        data,
        pagination: {
            hasNext,
            cursor: nextCursor,
            count: data.length
        }
    });
}
```

---

## TOPIC 2 — QUEUE ARCHITECTURE

### BullMQ — Production Job Queue

```javascript
// queue-system.js
const { Queue, Worker, QueueEvents } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
});

// Queue banana
const emailQueue = new Queue('emails', { connection });
const imageQueue = new Queue('images', { connection });

// Jobs add karo
async function sendWelcomeEmail(userId, email) {
    await emailQueue.add(
        'welcome-email',
        { userId, email },
        {
            attempts: 3,                    // 3 baar try karo
            backoff: {
                type: 'exponential',
                delay: 2000                 // 2s, 4s, 8s
            },
            removeOnComplete: 100,          // Last 100 completed rakhna
            removeOnFail: 50                // Last 50 failed rakhna
        }
    );
}

async function processImage(imageUrl, options) {
    await imageQueue.add(
        'resize',
        { imageUrl, options },
        { priority: 1 }                     // High priority
    );
}

// Worker — job process karo
const emailWorker = new Worker('emails', async (job) => {
    console.log(`Processing: ${job.name} for ${job.data.email}`);
    
    await job.updateProgress(25);
    await sendEmail(job.data);
    await job.updateProgress(100);
    
    return { sent: true, timestamp: new Date().toISOString() };
}, {
    connection,
    concurrency: 5     // 5 emails ek saath
});

// Events
const emailEvents = new QueueEvents('emails', { connection });

emailEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`Job ${jobId} completed:`, returnvalue);
});

emailEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`Job ${jobId} failed:`, failedReason);
});

// Queue stats
async function getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
        emailQueue.getWaitingCount(),
        emailQueue.getActiveCount(),
        emailQueue.getCompletedCount(),
        emailQueue.getFailedCount()
    ]);
    
    return { waiting, active, completed, failed };
}

module.exports = { emailQueue, imageQueue, sendWelcomeEmail };
```

---

## TOPIC 3 — HANDLE 1 MILLION REQUESTS

### Architecture Strategy

```
┌──────────────────────────────────────────────────────────┐
│              1 MILLION REQUESTS ARCHITECTURE             │
│                                                          │
│  Client Requests                                         │
│       ↓                                                  │
│  Load Balancer (Nginx/AWS ALB)                           │
│       ↓                                                  │
│  ┌────────────────────────────────┐                      │
│  │  Node.js Cluster (Horizontal) │                      │
│  │  Server 1 (4 workers)         │                      │
│  │  Server 2 (4 workers)         │                      │
│  │  Server 3 (4 workers)         │                      │
│  └────────────────────────────────┘                      │
│       ↓                                                  │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  Redis Cache │  │   Database   │                     │
│  │  (L1 cache)  │  │  (Primary +  │                     │
│  │              │  │   Replicas)  │                     │
│  └──────────────┘  └──────────────┘                     │
│       ↓                                                  │
│  ┌──────────────────────────────────┐                    │
│  │  Job Queues (BullMQ + Redis)     │                   │
│  │  Background Workers              │                    │
│  └──────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────┘
```

### Key Strategies

```javascript
// 1. Connection Pooling
const pool = {
    min: 5,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
};

// 2. Caching Layer
async function getUserWithCache(userId) {
    const cacheKey = `user:${userId}`;
    
    // L1 — In-memory cache (microseconds)
    let user = memoryCache.get(cacheKey);
    if(user) return { user, source: 'memory' };
    
    // L2 — Redis cache (milliseconds)
    const cached = await redis.get(cacheKey);
    if(cached) {
        user = JSON.parse(cached);
        memoryCache.set(cacheKey, user, 60); // 1 min memory cache
        return { user, source: 'redis' };
    }
    
    // L3 — Database (tens of milliseconds)
    user = await db.users.findById(userId);
    
    // Cache karo
    await redis.setex(cacheKey, 300, JSON.stringify(user)); // 5 min
    memoryCache.set(cacheKey, user, 60);
    
    return { user, source: 'database' };
}

// 3. Circuit Breaker Pattern
class CircuitBreaker {
    constructor(fn, options = {}) {
        this.fn = fn;
        this.threshold = options.threshold || 5;
        this.timeout = options.timeout || 60000;
        this.failures = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.lastFailureTime = null;
    }
    
    async execute(...args) {
        if(this.state === 'OPEN') {
            if(Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker OPEN — service unavailable');
            }
        }
        
        try {
            const result = await this.fn(...args);
            
            if(this.state === 'HALF_OPEN') {
                this.state = 'CLOSED';
                this.failures = 0;
            }
            
            return result;
            
        } catch(err) {
            this.failures++;
            this.lastFailureTime = Date.now();
            
            if(this.failures >= this.threshold) {
                this.state = 'OPEN';
                console.error('Circuit breaker OPENED!');
            }
            
            throw err;
        }
    }
}
```

---

## TOPIC 4 — MICROSERVICES COMMUNICATION

```javascript
// HTTP Communication between services
class ServiceClient {
    constructor(baseUrl, options = {}) {
        this.baseUrl = baseUrl;
        this.timeout = options.timeout || 5000;
        this.retries = options.retries || 3;
        this.circuitBreaker = new CircuitBreaker(
            this.makeRequest.bind(this)
        );
    }
    
    async makeRequest(path, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(
            () => controller.abort(), 
            this.timeout
        );
        
        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Service-Name': process.env.SERVICE_NAME,
                    ...options.headers
                }
            });
            
            if(!response.ok) {
                throw new Error(`Service error: ${response.status}`);
            }
            
            return response.json();
            
        } finally {
            clearTimeout(timeout);
        }
    }
    
    async get(path) {
        return this.circuitBreaker.execute(path, { method: 'GET' });
    }
    
    async post(path, body) {
        return this.circuitBreaker.execute(path, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
}

// Services
const userService = new ServiceClient('http://user-service:3001');
const orderService = new ServiceClient('http://order-service:3002');

// Use karo
async function getFullUserData(userId) {
    const [user, orders] = await Promise.all([
        userService.get(`/users/${userId}`),
        orderService.get(`/orders?userId=${userId}`)
    ]);
    
    return { user, orders };
}
```

---

## FINAL PROJECT — Complete Production API

```javascript
// final-app.js — Yeh sab phases ka combination hai

const http = require('http');
const { AsyncLocalStorage } = require('async_hooks');
const { performance } = require('perf_hooks');
const crypto = require('crypto');
const fs = require('fs').promises;
const cluster = require('cluster');
const os = require('os');

// ── Request Context ──────────────────────────────────────
const requestContext = new AsyncLocalStorage();

// ── Simple Logger ────────────────────────────────────────
function log(level, message, data = {}) {
    const ctx = requestContext.getStore() || {};
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        pid: process.pid,
        requestId: ctx.requestId,
        userId: ctx.userId,
        ...data
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
}

// ── In-Memory Store with Persistence ─────────────────────
class DataStore {
    constructor() {
        this.data = { users: [], posts: [], nextIds: {users: 1, posts: 1} };
        this.dirty = false;
        this.saveInterval = setInterval(() => this.persist(), 10000);
        this.saveInterval.unref();
        this.load();
    }
    
    async load() {
        try {
            const raw = await fs.readFile('data.json', 'utf8');
            this.data = JSON.parse(raw);
            log('info', 'Data loaded from disk');
        } catch {
            log('info', 'Starting with fresh data');
        }
    }
    
    async persist() {
        if(!this.dirty) return;
        await fs.writeFile('data.json', JSON.stringify(this.data, null, 2));
        this.dirty = false;
    }
    
    find(collection, predicate) {
        return this.data[collection]?.filter(predicate) || [];
    }
    
    findOne(collection, predicate) {
        return this.data[collection]?.find(predicate) || null;
    }
    
    insert(collection, item) {
        const id = this.data.nextIds[collection]++;
        const newItem = { id, createdAt: new Date().toISOString(), ...item };
        this.data[collection].push(newItem);
        this.dirty = true;
        return newItem;
    }
    
    update(collection, id, updates) {
        const idx = this.data[collection].findIndex(i => i.id === id);
        if(idx === -1) return null;
        this.data[collection][idx] = { 
            ...this.data[collection][idx], 
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.dirty = true;
        return this.data[collection][idx];
    }
    
    delete(collection, id) {
        const idx = this.data[collection].findIndex(i => i.id === id);
        if(idx === -1) return false;
        this.data[collection].splice(idx, 1);
        this.dirty = true;
        return true;
    }
}

// ── Middleware System ─────────────────────────────────────
class MiddlewareChain {
    constructor() {
        this.middlewares = [];
    }
    
    use(fn) {
        this.middlewares.push(fn);
        return this;
    }
    
    async run(req, res) {
        let idx = 0;
        
        const next = async () => {
            if(idx >= this.middlewares.length) return;
            const fn = this.middlewares[idx++];
            await fn(req, res, next);
        };
        
        await next();
    }
}

// ── Router ────────────────────────────────────────────────
class Router {
    constructor() {
        this.routes = [];
        this.middlewares = new MiddlewareChain();
    }
    
    register(method, pattern, ...handlers) {
        this.routes.push({ method, pattern, handlers });
        return this;
    }
    
    get(pattern, ...handlers) { return this.register('GET', pattern, ...handlers); }
    post(pattern, ...handlers) { return this.register('POST', pattern, ...handlers); }
    put(pattern, ...handlers) { return this.register('PUT', pattern, ...handlers); }
    delete(pattern, ...handlers) { return this.register('DELETE', pattern, ...handlers); }
    
    match(method, pathname) {
        for(const route of this.routes) {
            if(route.method !== method) continue;
            
            const regexPattern = route.pattern
                .replace(/:([^/]+)/g, '(?<$1>[^/]+)')
                .replace(/\//g, '\\/');
            
            const match = pathname.match(new RegExp(`^${regexPattern}$`));
            if(match) {
                return { handlers: route.handlers, params: match.groups || {} };
            }
        }
        return null;
    }
}

// ── Server Factory ────────────────────────────────────────
function createApp() {
    const db = new DataStore();
    const router = new Router();
    const cache = new Map();
    const rateLimits = new Map();
    
    // ── Helpers ──────────────────────────────────────────
    const send = (res, status, data) => {
        res.writeHead(status, { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        });
        res.end(JSON.stringify(data, null, 2));
    };
    
    const parseBody = (req) => new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if(body.length > 1048576) reject(new Error('Body too large'));
        });
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch { reject(new Error('Invalid JSON')); }
        });
        req.on('error', reject);
    });
    
    // ── JWT ──────────────────────────────────────────────
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
    
    const signToken = (payload) => {
        const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
        const pay = Buffer.from(JSON.stringify({
            ...payload,
            iat: Math.floor(Date.now()/1000),
            exp: Math.floor(Date.now()/1000) + 86400
        })).toString('base64url');
        const sig = crypto.createHmac('sha256', JWT_SECRET)
            .update(`${header}.${pay}`).digest('base64url');
        return `${header}.${pay}.${sig}`;
    };
    
    const verifyToken = (token) => {
        const [h, p, s] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', JWT_SECRET)
            .update(`${h}.${p}`).digest('base64url');
        if(s !== expectedSig) throw new Error('Invalid token');
        const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
        if(payload.exp < Date.now()/1000) throw new Error('Token expired');
        return payload;
    };
    
    // ── Middleware ───────────────────────────────────────
    const authMiddleware = async (req, res, next) => {
        const header = req.headers.authorization;
        if(!header?.startsWith('Bearer ')) {
            return send(res, 401, { error: 'Authorization required' });
        }
        try {
            req.user = verifyToken(header.slice(7));
            await next();
        } catch(err) {
            send(res, 401, { error: err.message });
        }
    };
    
    const validateMiddleware = (schema) => async (req, res, next) => {
        const body = await parseBody(req);
        req.body = body;
        
        for(const [field, rule] of Object.entries(schema)) {
            if(rule.required && !body[field]) {
                return send(res, 400, { 
                    error: `${field} is required`,
                    field 
                });
            }
            if(rule.type && body[field] && typeof body[field] !== rule.type) {
                return send(res, 400, {
                    error: `${field} must be ${rule.type}`,
                    field
                });
            }
        }
        
        await next();
    };
    
    // ── Routes ───────────────────────────────────────────
    
    // Health
    router.get('/health', async (req, res) => {
        send(res, 200, {
            status: 'healthy',
            uptime: process.uptime().toFixed(2),
            pid: process.pid,
            memory: {
                used: `${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)}MB`
            },
            timestamp: new Date().toISOString()
        });
    });
    
    // Auth
    router.post('/auth/login',
        validateMiddleware({
            email: { required: true, type: 'string' },
            password: { required: true, type: 'string' }
        }),
        async (req, res) => {
            const { email, password } = req.body;
            const user = db.findOne('users', u => u.email === email);
            
            if(!user) return send(res, 401, { error: 'Invalid credentials' });
            
            const passwordHash = crypto.createHash('sha256')
                .update(password).digest('hex');
            
            if(user.passwordHash !== passwordHash) {
                return send(res, 401, { error: 'Invalid credentials' });
            }
            
            const token = signToken({ userId: user.id, role: user.role });
            
            log('info', 'User logged in', { userId: user.id });
            send(res, 200, { token, user: { id: user.id, name: user.name, email: user.email } });
        }
    );
    
    router.post('/auth/register',
        validateMiddleware({
            name: { required: true, type: 'string' },
            email: { required: true, type: 'string' },
            password: { required: true, type: 'string' }
        }),
        async (req, res) => {
            const { name, email, password } = req.body;
            
            if(db.findOne('users', u => u.email === email)) {
                return send(res, 409, { error: 'Email already exists' });
            }
            
            const passwordHash = crypto.createHash('sha256')
                .update(password).digest('hex');
            
            const user = db.insert('users', { name, email, passwordHash, role: 'user' });
            const token = signToken({ userId: user.id, role: user.role });
            
            log('info', 'User registered', { userId: user.id });
            send(res, 201, { 
                token,
                user: { id: user.id, name: user.name, email: user.email }
            });
        }
    );
    
    // Users (protected)
    router.get('/api/users', authMiddleware, async (req, res) => {
        const users = db.find('users', () => true)
            .map(({ passwordHash, ...u }) => u); // password hide karo
        send(res, 200, { users, total: users.length });
    });
    
    router.get('/api/users/:id', authMiddleware, async (req, res) => {
        const user = db.findOne('users', u => u.id === parseInt(req.params.id));
        if(!user) return send(res, 404, { error: 'User not found' });
        const { passwordHash, ...safeUser } = user;
        send(res, 200, safeUser);
    });
    
    // Posts
    router.get('/api/posts', async (req, res) => {
        const { page = 1, limit = 10 } = req.query || {};
        const all = db.find('posts', () => true);
        const start = (parseInt(page) - 1) * parseInt(limit);
        const posts = all.slice(start, start + parseInt(limit));
        
        send(res, 200, {
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: all.length,
                pages: Math.ceil(all.length / parseInt(limit))
            }
        });
    });
    
    router.post('/api/posts', authMiddleware,
        validateMiddleware({
            title: { required: true, type: 'string' },
            content: { required: true, type: 'string' }
        }),
        async (req, res) => {
            const post = db.insert('posts', {
                title: req.body.title,
                content: req.body.content,
                authorId: req.user.userId
            });
            
            log('info', 'Post created', { postId: post.id });
            send(res, 201, post);
        }
    );
    
    router.delete('/api/posts/:id', authMiddleware, async (req, res) => {
        const post = db.findOne('posts', p => p.id === parseInt(req.params.id));
        if(!post) return send(res, 404, { error: 'Post not found' });
        
        if(post.authorId !== req.user.userId && req.user.role !== 'admin') {
            return send(res, 403, { error: 'Forbidden' });
        }
        
        db.delete('posts', parseInt(req.params.id));
        res.writeHead(204);
        res.end();
    });
    
    // ── HTTP Server ──────────────────────────────────────
    const server = http.createServer(async (req, res) => {
        const requestId = crypto.randomBytes(8).toString('hex');
        const start = performance.now();
        
        // Default headers
        res.setHeader('X-Request-ID', requestId);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 
            'Content-Type, Authorization');
        
        if(req.method === 'OPTIONS') {
            res.writeHead(204);
            return res.end();
        }
        
        // Rate limiting
        const ip = req.socket.remoteAddress;
        const rl = rateLimits.get(ip) || { count: 0, reset: Date.now() + 60000 };
        if(Date.now() > rl.reset) { rl.count = 0; rl.reset = Date.now() + 60000; }
        rl.count++;
        rateLimits.set(ip, rl);
        
        if(rl.count > 100) {
            res.writeHead(429, {'Content-Type': 'application/json'});
            return res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
        }
        
        const url = new URL(req.url, 'http://localhost');
        req.query = Object.fromEntries(url.searchParams);
        
        await requestContext.run({ requestId }, async () => {
            try {
                const route = router.match(req.method, url.pathname);
                
                if(!route) {
                    return send(res, 404, { 
                        error: `${req.method} ${url.pathname} not found` 
                    });
                }
                
                req.params = route.params;
                
                // Run all handlers (middleware chain)
                let idx = 0;
                const next = async () => {
                    if(idx < route.handlers.length) {
                        await route.handlers[idx++](req, res, next);
                    }
                };
                
                await next();
                
            } catch(err) {
                log('error', 'Request error', {
                    message: err.message,
                    stack: err.stack,
                    requestId
                });
                send(res, 500, { 
                    error: process.env.NODE_ENV === 'production' 
                        ? 'Internal server error' 
                        : err.message 
                });
            }
            
            const duration = (performance.now() - start).toFixed(2);
            log('http', `${req.method} ${url.pathname}`, {
                status: res.statusCode,
                duration: `${duration}ms`,
                requestId
            });
        });
    });
    
    return { server, db };
}

// ── Cluster Mode ─────────────────────────────────────────
if(cluster.isMaster) {
    const cpus = os.cpus().length;
    log('info', `Master ${process.pid} starting ${cpus} workers`);
    
    for(let i = 0; i < cpus; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', (worker, code) => {
        log('warn', `Worker ${worker.pid} died (${code}) — restarting`);
        cluster.fork();
    });
    
} else {
    const { server } = createApp();
    const PORT = process.env.PORT || 3000;
    
    server.listen(PORT, () => {
        log('info', `Worker ${process.pid} listening`, { port: PORT });
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        server.close(() => {
            log('info', `Worker ${process.pid} gracefully closed`);
            process.exit(0);
        });
    });
}

// ══════════════════════════════════════════════
// USAGE:
//
// Development:
// node final-app.js
//
// Production (all cores):
// NODE_ENV=production node final-app.js
//
// With PM2:
// pm2 start final-app.js -i max
//
// Test:
// curl http://localhost:3000/health
// curl -X POST http://localhost:3000/auth/register \
//   -H "Content-Type: application/json" \
//   -d '{"name":"Aryan","email":"a@a.com","password":"123"}'
// curl -H "Authorization: Bearer <token>" \
//   http://localhost:3000/api/users
// ══════════════════════════════════════════════
