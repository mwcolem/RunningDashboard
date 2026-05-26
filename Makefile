.PHONY: backend frontend dev

backend:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8001

frontend:
	cd frontend && npm run dev

dev:
	make -j2 backend frontend
