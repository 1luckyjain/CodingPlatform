"""
utils/code_preprocessor.py
───────────────────────────
Normalises source code before similarity analysis.

Steps applied (per language):
  1. Strip single-line and multi-line comments
  2. Collapse all whitespace / blank lines
  3. Lowercase everything
  4. (Optional) Rename user-chosen identifiers to generic tokens
     — keeps variable renaming tricks from fooling the detector
"""

import re
from typing import Optional


# ─── Comment-stripping patterns ───────────────────────────────────────────────

_PATTERNS = {
    "python": [
        (r"#[^\n]*", ""),                          # single-line comments
        (r'"""[\s\S]*?"""', ""),                    # docstrings (triple-double)
        (r"'''[\s\S]*?'''", ""),                    # docstrings (triple-single)
    ],
    "cpp": [
        (r"//[^\n]*", ""),                          # single-line
        (r"/\*[\s\S]*?\*/", ""),                    # multi-line
    ],
    "java": [
        (r"//[^\n]*", ""),
        (r"/\*[\s\S]*?\*/", ""),
    ],
    "js": [
        (r"//[^\n]*", ""),
        (r"/\*[\s\S]*?\*/", ""),
    ],
    "c": [
        (r"//[^\n]*", ""),
        (r"/\*[\s\S]*?\*/", ""),
    ],
}

# Identifiers that are NOT language keywords — rename to generic tokens
_IDENTIFIER_RE = re.compile(r"\b([a-zA-Z_][a-zA-Z0-9_]{2,})\b")

# Simple keyword sets to protect from renaming
_KEYWORDS = {
    "python": {
        "def", "class", "return", "if", "else", "elif", "for", "while",
        "import", "from", "in", "and", "or", "not", "is", "None", "True",
        "False", "lambda", "with", "as", "try", "except", "finally",
        "break", "continue", "pass", "yield", "global", "nonlocal",
        "print", "len", "range", "int", "str", "float", "list", "dict",
        "set", "tuple", "append", "input", "output", "self",
    },
    "cpp": {
        "int", "long", "double", "float", "char", "bool", "void",
        "string", "vector", "map", "set", "pair", "cout", "cin",
        "endl", "include", "using", "namespace", "std", "return",
        "if", "else", "for", "while", "do", "break", "continue",
        "class", "struct", "public", "private", "protected", "new",
        "delete", "nullptr", "true", "false", "const", "auto",
        "sort", "min", "max", "push_back", "size", "main",
    },
    "java": {
        "int", "long", "double", "float", "char", "boolean", "void",
        "String", "System", "out", "println", "return", "if", "else",
        "for", "while", "do", "break", "continue", "class", "public",
        "private", "protected", "static", "new", "null", "true", "false",
        "import", "package", "this", "super", "extends", "implements",
        "interface", "abstract", "final", "try", "catch", "finally",
        "throw", "throws", "main", "args",
    },
    "js": {
        "var", "let", "const", "function", "return", "if", "else",
        "for", "while", "do", "break", "continue", "class", "new",
        "null", "undefined", "true", "false", "import", "export",
        "from", "this", "console", "log", "typeof", "instanceof",
        "async", "await", "try", "catch", "finally", "throw",
        "switch", "case", "default", "of", "in", "map", "filter",
        "reduce", "push", "pop", "length", "forEach",
    },
}
# Fall back for unknown languages
_KEYWORDS["c"] = _KEYWORDS["cpp"]
_DEFAULT_KEYWORDS: set = set()


def _strip_comments(code: str, language: str) -> str:
    patterns = _PATTERNS.get(language.lower(), _PATTERNS.get("cpp", []))
    for pattern, replacement in patterns:
        code = re.sub(pattern, replacement, code)
    return code


def _normalize_whitespace(code: str) -> str:
    # collapse tabs / multiple spaces to a single space, strip blank lines
    code = re.sub(r"[ \t]+", " ", code)
    code = re.sub(r"\n+", "\n", code)
    return code.strip().lower()


def _rename_identifiers(code: str, language: str) -> str:
    """
    Replace user-defined identifiers (non-keywords, length >= 3)
    with a generic token 'VAR' so that renaming variables doesn't
    fool the similarity check.
    """
    keywords = _KEYWORDS.get(language.lower(), _DEFAULT_KEYWORDS)
    counter = {"n": 0}
    mapping: dict = {}

    def replacer(match: re.Match) -> str:
        token = match.group(1)
        if token in keywords:
            return token
        if token not in mapping:
            mapping[token] = f"var{counter['n']}"
            counter["n"] += 1
        return mapping[token]

    return _IDENTIFIER_RE.sub(replacer, code)


def preprocess(
    code: str,
    language: str,
    rename_identifiers: bool = True,
) -> str:
    """
    Full preprocessing pipeline.

    Parameters
    ----------
    code              : Raw source code string.
    language          : Language key ('python', 'cpp', 'java', 'js', 'c').
    rename_identifiers: If True, user-defined names are replaced with
                        generic tokens — catches naive variable renaming.

    Returns
    -------
    Normalised code string ready for vectorisation.
    """
    lang = language.lower().strip()
    code = _strip_comments(code, lang)
    if rename_identifiers:
        code = _rename_identifiers(code, lang)
    code = _normalize_whitespace(code)
    return code
