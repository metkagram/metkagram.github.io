from __future__ import annotations, print_function, unicode_literals
from numpy import empty
import spacy
from spacy import displacy


nlp = spacy.load("en_core_web_trf")
# Ensure you 're consuming enough water daily.
# I sat on the chai
# The book that I read last night was great.
# The keys must have fallen below the sofa; I can 't find them anywhere else.
doc = nlp("Last year, I led a team that won an award for innovation")
displacy.serve(doc, style="dep")

for nk in doc.noun_chunks:
    print(nk.text_with_ws)
for token in doc:

    print(
        token.text,
        token.pos_,
        token.tag_,
        token.dep_,
        token.morph.to_dict(),
        [child.text for child in token.children],
        [child.dep_ for child in token.children],
        [child.tag_ for child in token.children],
    )
