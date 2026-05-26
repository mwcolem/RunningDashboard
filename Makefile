.PHONY: backend frontend dev

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

dev:
	make -j2 backend frontend
