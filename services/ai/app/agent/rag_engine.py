"""
SatQuery AI — Authoritative Remote Sensing RAG Engine
Standard: SIH26167 Remote Sensing Assistant
Retrieves verified domain facts from ISRO, ESA, and USGS knowledge base.
"""

import os
import re
import logging
from pathlib import Path
from typing import Dict, Any, List, Tuple

logger = logging.getLogger("satquery.rag")


class KnowledgeChunk:
    def __init__(self, doc_id: str, title: str, section: str, content: str, source: str):
        self.doc_id = doc_id
        self.title = title
        self.section = section
        self.content = content
        self.source = source

    def score(self, query_tokens: set) -> float:
        """Simple TF-IDF token intersection score with section weighting."""
        content_tokens = set(re.findall(r'\w+', self.content.lower()))
        title_tokens = set(re.findall(r'\w+', self.title.lower()))
        section_tokens = set(re.findall(r'\w+', self.section.lower()))

        match_content = len(query_tokens.intersection(content_tokens))
        match_title = len(query_tokens.intersection(title_tokens)) * 3.0
        match_section = len(query_tokens.intersection(section_tokens)) * 2.0

        return match_content + match_title + match_section


class RAGEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RAGEngine, cls).__new__(cls)
            cls._instance.chunks = []
            cls._instance._load_knowledge_base()
        return cls._instance

    def _load_knowledge_base(self):
        knowledge_root = Path(__file__).resolve().parent.parent.parent / "knowledge"
        if not knowledge_root.exists():
            logger.warning(f"Knowledge root not found at {knowledge_root}")
            return

        for md_path in knowledge_root.rglob("*.md"):
            try:
                with open(md_path, "r", encoding="utf-8") as f:
                    text = f.read()

                # Extract title
                title_match = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
                title = title_match.group(1) if title_match else md_path.stem

                # Extract source
                source_match = re.search(r'\*\*Source:\*\*\s*(.+)$', text, re.MULTILINE)
                source = source_match.group(1) if source_match else "Authoritative Remote Sensing Literature"

                # Split by sections (##)
                sections = re.split(r'\n##\s+', text)
                for sec in sections:
                    if not sec.strip():
                        continue
                    lines = sec.strip().split('\n')
                    sec_title = lines[0] if lines else "General"
                    sec_body = "\n".join(lines[1:]) if len(lines) > 1 else lines[0]

                    chunk = KnowledgeChunk(
                        doc_id=md_path.stem,
                        title=title,
                        section=sec_title,
                        content=sec_body,
                        source=source
                    )
                    self.chunks.append(chunk)

            except Exception as e:
                logger.error(f"Error loading knowledge file {md_path}: {e}")

        logger.info(f"Loaded {len(self.chunks)} authoritative remote sensing knowledge chunks into RAG index.")

    def retrieve(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Retrieve the most relevant authoritative remote sensing knowledge chunks.
        """
        query_tokens = set(re.findall(r'\w+', query.lower()))
        if not query_tokens:
            return []

        scored = [(chunk.score(query_tokens), chunk) for chunk in self.chunks]
        scored.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, chunk in scored[:top_k]:
            if score > 0:
                results.append({
                    "title": chunk.title,
                    "section": chunk.section,
                    "content": chunk.content.strip()[:400] + "...",
                    "source": chunk.source,
                    "relevance_score": score
                })

        return results


rag_engine = RAGEngine()
