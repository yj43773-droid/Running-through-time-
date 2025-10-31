# System Architecture: Gemini API Integration

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
│              (React + Vite)                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTP/JSON API
                           │
         ┌─────────────────▼──────────────────┐
         │    Express Backend Server          │
         │      (Node.js + TypeScript)        │
         └─────────────────┬──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐    ┌────────▼────────┐    ┌──▼────┐
   │ Database │    │  AI Services    │    │Vector │
   │(SQLite)  │    │ (Gemini API)    │    │Store  │
   │          │    │                 │    │(Cache)│
   └──────────┘    └─────────────────┘    └───────┘
```

---

## 📊 Request Flow: Create Diary

### With API Key Present
```
POST /api/diaries
{
  "text": "...",
  "emotion": "..."
}
         │
         ▼
┌─────────────────────────┐
│  Authentication Check   │
│  (JWT Token)            │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Create Diary Entry     │
│  (Save to Database)     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  AI Service             │
│  (generateResponses)    │
└────────────┬────────────┘
             │
    ┌────────┴────────┐
    │ Check API Key   │
    └────────┬────────┘
             │
    ┌────────▼──────────┐
    │  Key Available?   │
    └────┬──────────┬───┘
         │ YES      │ NO
    ┌────▼──┐   ┌──▼──────────┐
    │ RAG   │   │ Templates    │
    │Service│   │ (Fast)       │
    └────┬──┘   └──┬───────────┘
         │         │
    ┌────▼─────────▼──┐
    │ Combine Results │
    │ (3 Personas)    │
    └────┬────────────┘
         │
         ▼
    ┌─────────────────┐
    │ Update Diary    │
    │ with Responses  │
    └────┬────────────┘
         │
         ▼
    ┌─────────────────┐
    │ Return Response │
    │ (201 Created)   │
    └─────────────────┘
```

---

## 🔄 Error Handling Flow

```
                Create Diary
                     │
                     ▼
            ┌────────────────┐
            │ AI Service     │
            │ (Orchestrator) │
            └────────┬───────┘
                     │
              ┌──────▼──────┐
              │ API Key     │
              │ Validation  │
              └──┬───────┬──┘
                 │       │
           VALID │       │ INVALID
                 │       └──────────┐
                 │                  │
            ┌────▼────┐      ┌─────▼──────┐
            │ RAG     │      │ Templates  │
            │ Service │      │ (Return)   │
            └────┬────┘      └────────────┘
                 │
          ┌──────▼──────┐
          │ Initialize  │
          │ Gemini      │
          └──┬───────┬──┘
             │       │
        OK   │       │ ERROR
             │       └──────┐
             │              │
         ┌───▼──┐    ┌─────▼────┐
         │Prompt│    │Templates  │
         │Loop  │    │(Fallback) │
         └───┬──┘    └───────────┘
             │
      ┌──────▼──────┐
      │ Per-Persona │
      │ Try-Catch   │
      └──┬───────┬──┘
         │       │
    SUCCESS ERROR
         │       │
         │   ┌───▼──┐
         │   │Persona
         │   │Template
         │   └───────┘
         │       │
         └───┬───┘
             │
         ┌───▼──────┐
         │Combine   │
         │Responses │
         └───┬──────┘
             │
             ▼
        Return (Always 3)
```

---

## 🎯 Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  AI Service (ai.service.ts)                  │
│                                                               │
│  generateResponses(diary, userId)                            │
│  ├─ Check API Key (validation)                               │
│  ├─ If key valid → Call RAG                                  │
│  ├─ If key invalid → Use Templates                           │
│  └─ Return PersonaResponse[]                                 │
│                                                               │
│  analyzeEmotions(content)                                    │
│  ├─ Check API Key                                            │
│  ├─ If available → Use Gemini                                │
│  └─ If not → Return neutral                                  │
└──────────────────┬─────────────────────────────────────────┘
                   │
        ┌──────────▼───────────┐
        │                      │
        ▼                      ▼
┌──────────────────┐  ┌────────────────────┐
│  RAG Service     │  │ Templates          │
│(rag.service.ts) │  │(Fallback)          │
│                  │  │                    │
│initializeGenAI() │  │generateTemplate    │
│├─Validate Key    │  │Responses()         │
│├─Try Init        │  │                    │
│├─Catch Errors    │  │Always Available    │
│└─Return Instance │  │(3 personas)        │
│                  │  │                    │
│generateRAG       │  │getTemplateResponse│
│Responses()       │  │(persona, diary)    │
│├─Per Persona Loop│  │                    │
│├─Try API Call    │  │Hardcoded Messages  │
│├─Catch Error     │  │                    │
│└─Fallback to     │  │• Gentle           │
│  Templates       │  │• Pragmatic        │
└────────┬─────────┘  │• Humorous         │
         │            │                    │
         └────────┬───┴─────────────────────┘
                  │
                  ▼
           Vector Store Service
         (vector-store.service.ts)

         ├─ searchSimilarDiaries()
         │  ├─ In-memory cache lookup
         │  └─ Keyword-based similarity
         │
         ├─ addDiaryToVectorStore()
         │  └─ Cache management
         │
         └─ initializeVectorStore()
            ├─ Check API Key
            ├─ Try GoogleGenerativeAI
            └─ Fallback to cache
```

---

## 🗄️ Data Flow

```
┌─────────────────────────────────┐
│    User Input (Diary)           │
│  { text, emotion, character }   │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │  Database Store    │
    │  (SQLite)          │
    │                    │
    │  diaries:          │
    │  ├─ id             │
    │  ├─ userId         │
    │  ├─ text           │
    │  ├─ emotion        │
    │  └─ responses (AI) │
    │                    │
    │  memory_orbs:      │
    │  ├─ id             │
    │  ├─ userId         │
    │  └─ diaryId        │
    └────────────────────┘
             │
    ┌────────▼──────────┐
    │  Vector Store     │
    │  (Cache)          │
    │                   │
    │  diaryCache:      │
    │  Map<id, entry>   │
    │  ├─ id            │
    │  ├─ text          │
    │  ├─ emotion       │
    │  └─ similarity    │
    └───────────────────┘
             │
    ┌────────▼──────────┐
    │  AI Processing    │
    │                   │
    │  Context:         │
    │  ├─ Diary text    │
    │  ├─ Emotion       │
    │  ├─ Similar past  │
    │  └─ Persona style │
    └───────────────────┘
             │
    ┌────────▼──────────┐
    │  AI Responses     │
    │  3 × Persona      │
    │  ├─ Message       │
    │  ├─ Style         │
    │  └─ Label         │
    └───────────────────┘
```

---

## ⚙️ Service Dependencies

```
┌─────────────────────────────────────────────────┐
│           Express Server                        │
│           (server.ts)                           │
│                                                 │
│  Initializes:                                   │
│  ├─ Database (db.ts)                            │
│  ├─ Routes (auth, diaries, orbs)                │
│  └─ Middleware (auth, cors)                     │
└──────────────────┬────────────────────────────┘
                   │
        ┌──────────▼───────────┐
        │                      │
        ▼                      ▼
   ┌─────────┐            ┌──────────┐
   │Database │            │Routes    │
   │(db.ts)  │            │          │
   └────┬────┘            │ POST /api│
        │                 │ /diaries │
   ┌────▼──────┐          │          │
   │Tables     │          └────┬─────┘
   │Create     │               │
   │           │      ┌────────▼───────┐
   │Vector     │      │Diary Handler   │
   │Store Init │      │(diaries.ts)    │
   │           │      │                │
   │In-memory  │      │├─ Validate     │
   │Cache      │      │├─ Create DB    │
   │           │      │├─ Generate AI  │
   └───────────┘      │└─ Return resp  │
                      └────────┬───────┘
                               │
                      ┌────────▼──────────┐
                      │AI Service         │
                      │(ai.service.ts)    │
                      │                   │
                      │├─ Check API key   │
                      │├─ Route to RAG    │
                      │├─ Or Templates    │
                      │└─ Combine results │
                      └────────┬──────────┘
                               │
                      ┌────────▼─────────┐
                      │RAG or Templates  │
                      │                  │
                      │├─ RAG Service    │
                      ││ (API calls)     │
                      ││                 │
                      │└─ Template       │
                      │  (Fast/Simple)   │
                      └──────────────────┘
```

---

## 🔌 API Endpoints

```
┌─────────────────────────────────────────────────────┐
│            Diary Routes (/api/diaries)              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ GET /               List user's diaries             │
│ ├─ Query: limit, offset, emotion, isEvolved       │
│ └─ Response: { items[], limit, offset, hasMore }  │
│                                                     │
│ POST /              Create diary with AI responses │
│ ├─ Body: { text, emotion, aiCharacter }           │
│ ├─ Process: Create DB → Call AI → Update DB       │
│ └─ Response: Diary with aiPersonaResponses[]      │
│                                                     │
│ GET /:diaryId       Get single diary              │
│ ├─ Auth: JWT Required                             │
│ └─ Response: Diary with all fields                │
│                                                     │
│ PUT /:diaryId       Update diary                  │
│ PATCH /:diaryId     (same)                        │
│ ├─ Body: Allowed fields only                      │
│ └─ Response: Updated diary                        │
│                                                     │
│ DELETE /:diaryId    Delete diary                  │
│ └─ Response: 204 No Content                       │
│                                                     │
│ POST /:diaryId/     Regenerate AI responses       │
│ refresh-ai          (same 3 personas)             │
│ └─ Response: Updated diary                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Error Handling Strategy

```
┌──────────────────────────────────────────┐
│        Error Event Occurs                │
└────────────────┬─────────────────────────┘
                 │
        ┌────────▼────────┐
        │Check Error Type │
        └────┬─────┬──────┘
             │     │
        API  │     │ System
       ERROR │     │ ERROR
             │     │
        ┌────▼─┐  ┌┴───────┐
        │Tier1 │  │Critical?
        │Check │  └──┬───┬─┘
        └─┬──┬─┘     │ Y │ N
          │ ╱ ╲      │   │
    ┌─────▼┘   ╲     │   │
    │Personamax │   ┌┴─┐ ┌┴──┐
    │Error?     │   │Log
    └─┬──┬──┬───┘   │& │Log
      │ Y│ N│       │Fix│Resume
    ┌─▼──▼──▼────┐  │   │
    │Set Attempts│ └┬──┘ └────┐
    │= 3         │  │         │
    └─┬──────────┘  │    ┌────▼──┐
      │          ┌──┘    │Return │
      │          │       │Template
    ┌─▼───┐    ┌─▼──┐   └──┬────┘
    │Next │    │Log │      │
    │Persona   │Warn│   ┌──▼────┐
    └──┬───┘   └────┘   │Success │
       │            │    │Response
    ┌──▼────────────▼─┐  └────────┘
    │Combine All 3    │
    │(Success/Fallback
    │Responses)       │
    └────┬───────────┘
         │
    ┌────▼────────┐
    │Return to    │
    │Caller       │
    │(Always 3)   │
    └─────────────┘
```

---

## 📈 System Resilience Levels

```
Configuration Level:
┌─ Level 3: API Key Valid & Internet Available
│  └─ Full AI features enabled
│     └─ Personalized responses using Gemini
│
├─ Level 2: API Key Present But Invalid/Expired
│  └─ Graceful fallback to templates
│     └─ No errors, templates shown
│
├─ Level 1: No API Key Configured
│  └─ System defaults to templates
│     └─ All features work with templates
│
└─ Level 0: Any Error (Network, Timeout, etc)
   └─ Final fallback to templates
      └─ No crashes, system resilient
```

---

## 🎯 Key Design Decisions

### 1. **Graceful Degradation**
```
API Available     → Use AI
API Unavailable   → Use Templates
                  → Both produce valid output
```

### 2. **Multiple Fallback Layers**
```
Level 0: Upfront Check (ai.service.ts)
Level 1: Initialization (rag.service.ts)
Level 2: Per-Persona (generateRAGResponses)
Level 3: Catch-all (try-catch-all)
```

### 3. **Template Fallback Always Available**
```
✓ Hardcoded in memory
✓ No external dependencies
✓ Fast (<100ms)
✓ Always returns valid response
```

### 4. **Vector Store Optional**
```
Ideal: Full Chroma DB with embeddings
Good: In-memory cache with keyword search
Both: Work equally well for app
```

---

## 📊 Performance Characteristics

```
Scenario 1: With Valid API Key
├─ Initialization: ~100ms
├─ Request processing: ~2-3s
├─ Response quality: High (Personalized)
└─ Network usage: Yes

Scenario 2: Without API Key
├─ Initialization: ~10ms
├─ Request processing: <500ms
├─ Response quality: Good (Generic)
└─ Network usage: No

Scenario 3: API Timeout
├─ Fallback trigger: ~3s timeout
├─ Final response: <500ms additional
├─ Quality: Good (Fallback template)
└─ Network usage: Attempted then failed

Scenario 4: Vector Store Offline
├─ Impact: None (uses in-memory cache)
├─ Similarity search: Less accurate
├─ Performance: Better (no external call)
└─ User impact: Minimal
```

---

## 🚀 Deployment Architecture

```
Production Environment:
┌─────────────────────────────────┐
│  Nginx / Load Balancer          │
└────────────┬────────────────────┘
             │
      ┌──────▼────────┐
      │               │
   ┌──▼────┐      ┌───▼──┐
   │Instance│      │Instance
   │  1     │      │  2
   │        │      │
   │Express │      │Express
   │Backend │      │Backend
   │Port:   │      │Port:
   │5000    │      │5000
   └───┬────┘      └───┬───┘
       │               │
       └───────┬───────┘
               │
    ┌──────────▼──────────┐
    │  Shared Database    │
    │  (SQLite/PostgreSQL)│
    └─────────────────────┘
```

---

## 📚 File Structure Reference

```
backend_express/src/
├── server.ts                    ← Entry point, logging
├── db.ts                        ← Database + Vector init
├── middleware.ts                ← Auth, error handling
├── types.ts                     ← TypeScript interfaces
│
├── services/
│   ├── ai.service.ts            ← Orchestrator
│   ├── rag.service.ts           ← RAG logic + Gemini
│   ├── vector-store.service.ts  ← Vector search
│   ├── diary.service.ts         ← Database ops
│   ├── user.service.ts          ← User ops
│   └── orb.service.ts           ← Memory orb ops
│
├── routes/
│   ├── auth.ts                  ← Authentication
│   ├── diaries.ts               ← Diary CRUD + AI
│   └── orbs.ts                  ← Memory orb CRUD
│
└── (compiled JS in dist/)
```

---

This architecture ensures **reliability, scalability, and great user experience** regardless of API availability! 🎉
