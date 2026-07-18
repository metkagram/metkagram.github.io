import fastapi
import uvicorn
import spacy
import typer
import typing_extensions
import virtualenv
import transformers

print(f"FastAPI Version: {fastapi.__version__}")
print(f"Uvicorn Version: {uvicorn.__version__}")
print(f"Spacy Version: {spacy.__version__}")
print(f"Typer Version: {typer.__version__}")
print(f"Typing Extensions Version: {typing_extensions.__version__}")
print(f"Virtualenv Version: {virtualenv.__version__}")
print(f"Transformers Version: {transformers.__version__}")