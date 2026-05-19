# AI Provider Environment Variables

## Core routing

- AI_PROVIDER=ollama
- AI_PROVIDER_CHAIN=ollama,groq,openrouter,openai
- AI_LOCAL_FIRST=true
- AI_CHEAPEST_FIRST=false
- AI_AUTO_SELECT_PROVIDER=false
- AI_CONCURRENT_FALLBACK=true
- AI_HEDGE_DELAY_MS=1200
- AI_MAX_RETRIES=2
- AI_TIMEOUT_MS=30000
- AI_MAX_CONCURRENCY=4
- AI_SEMANTIC_CACHE=false
- AI_SEMANTIC_THRESHOLD=0.88

## OpenAI

- OPENAI_API_KEY=
- OPENAI_MODEL=gpt-4.1-mini
- OPENAI_BASE_URL=https://api.openai.com/v1
- OPENAI_EMBEDDING_MODEL=

## Ollama

- OLLAMA_BASE_URL=http://localhost:11434
- OLLAMA_MODEL=llama3
- OLLAMA_MODELS=llama3,mistral,phi3,deepseek,gemma
- OLLAMA_EMBEDDING_MODEL=

## OpenRouter

- OPENROUTER_API_KEY=
- OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
- OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
- OPENROUTER_ALLOWED_MODELS=
- OPENROUTER_FREE_ONLY=true
- OPENROUTER_EMBEDDING_MODEL=

## Groq

- GROQ_API_KEY=
- GROQ_MODEL=llama-3.1-8b-instant
- GROQ_BASE_URL=https://api.groq.com/openai/v1
- GROQ_EMBEDDING_MODEL=

## Hugging Face

- HUGGINGFACE_API_KEY=
- HUGGINGFACE_MODEL=HuggingFaceH4/zephyr-7b-beta
- HUGGINGFACE_BASE_URL=https://api-inference.huggingface.co/models

## Gemini

- GEMINI_API_KEY=
- GEMINI_MODEL=gemini-1.5-flash

## LM Studio

- LMSTUDIO_BASE_URL=http://localhost:1234/v1
- LMSTUDIO_MODEL=local-model
- LMSTUDIO_API_KEY=
- LMSTUDIO_EMBEDDING_MODEL=

## Together AI

- TOGETHER_API_KEY=
- TOGETHER_MODEL=meta-llama/Llama-3.1-8B-Instruct-Turbo
- TOGETHER_BASE_URL=https://api.together.xyz/v1
- TOGETHER_EMBEDDING_MODEL=
