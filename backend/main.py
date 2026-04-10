"""
Enterprise AI Hub — Flask 앱 진입점
실행: python main.py
"""
from flask import Flask, jsonify
from flask_cors import CORS
from config import settings
from routers.finance import finance_bp

app = Flask(__name__)

# CORS — Frontend 도메인만 허용
CORS(app, origins=[settings.frontend_url])

# 라우터 등록
app.register_blueprint(finance_bp, url_prefix="/api/finance")


@app.get("/")
def root():
    return jsonify({"status": "ok", "message": "Enterprise AI Hub API가 실행 중입니다."})


@app.get("/health")
def health():
    return jsonify({"status": "healthy"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=settings.port, debug=True)
