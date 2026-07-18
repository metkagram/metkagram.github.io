from __future__ import annotations, print_function, unicode_literals

import spacy

# from transformers import RetriBertConfig
#  from importlib.resources import read_text
# from ..deGram.annotation import TextSpan

# from __future__ import annotations
from numpy import empty
from pydantic import BaseModel
from typing import List, Optional

tag_questions = {
    ("wasn", "isn"): "st",
    ("don", "didn", "doesn"): "H",
    ("haven", "have", "hasn"): "Hr",
}

# Text Span ( for Flutter )
class TextSpan(BaseModel):
    text: str
    tag: str
    children: Optional[List[TextSpan]] = None
    extra: Optional[str] = None

    @classmethod
    def _init(cls, text: str, tag: str = "", extra: str = "", children: list = []):
        return cls(text=text, tag=tag, extra=extra, children=children)


TextSpan.update_forward_refs()


class TextModel(BaseModel):
    original_text: str
    pattern: str = ""
    chunkList: str = ""

    text_span: TextSpan

    @classmethod
    def custom_init(
        cls,
        original_text: str,
        text_span: TextSpan,
        chunkList: str = "",
    ):
        return cls(
            original_text=original_text,
            text_span=text_span,
            chunkList=chunkList,
        )


TextSpan.update_forward_refs()


class SpanGroupSet:
    textSpan: TextSpan = None

    def addChild(self, textSpan: TextSpan):
        if self.textSpan != None:
            self.textSpan.children.append(textSpan)

    def get(self):
        return self.textSpan


class Word(SpanGroupSet):
    def getMorphology(self, token: spacy.tokens.doc.Token, aspect: str):
        return token.morph.to_dict().get(aspect, "")

    def get_next_token(self):
        if self.token.i + 1 < len(self.doc):
            return self.doc[self.token.i + 1]
        return None

    # Constructor
    def __init__(
        self,
        token: spacy.tokens.doc.Token,
        isTagged: bool = True,
    ):
        self.func_dict = {
            "aux": self.enVerbAuxilary,
            "acomp": self.enVerbParticiple,
            "prt": self.phrasalVerbParticle,
            "acl": self.enVerbPart,
        }

        self.pos_func_dict = {
            "VERB": self.enVerbPart,
            "AUX": self.enVerbModal,
        }

        self.token = token
        self.isTagged = isTagged

        # Call the appropriate function based on the token's dependency
        if token.dep_ in self.func_dict:
            self.func_dict[token.dep_]()

        # Call the appropriate function based on the token's pos_
        elif token.pos_ in self.pos_func_dict:
            if token.pos_ == "AUX" and token.text != "m":
                self.enVerbModal()
            elif token.pos_ == "VERB" and (
                token.dep_
                in (
                    "xcomp",
                    "conj",
                    "relcl",   
                    'advcl'
                )
            ):
                verbForm: str = ""
                verbForm = self.getMorphology(self.token, "VerbForm")
                if self.token.tag_ == "VBG":  # Verb, gerund or present participle
                    self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                    self.addChild(TextSpan._init("pA", "tag"))
                    self.addChild(
                        TextSpan._init(self.token.text_with_ws, self.token.dep_)
                    )   
                 
                elif verbForm == "Inf":
                    self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                    if token.dep_ == "conj":
                        for child in self.token.children:
                            if child.dep_ == "aux":
                                self.addChild(TextSpan._init("v2", "tag"))
                                break

                        pass
                    else:
                        self.addChild(TextSpan._init("vI", "tag"))
                    self.addChild(
                        TextSpan._init(self.token.text_with_ws, self.token.dep_)
                    )
                elif self.token.tag_ in ("VB", "VBN"):  # Verb, past participle
                    verbForm =  token.morph.to_dict().get('VerbForm')
                    self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                    has_aux_child = any(child.dep_ == 'aux' for child in token.children)

                    if self.token.head.tag_ == "JJ"  :
                        self.addChild(TextSpan._init("p2", "tag"))
                    # Startled by the noise, the cat hid.
                    elif ( self.token.head.tag_ != "JJ"  and  has_aux_child == False ) or ( token.i == 0 and verbForm == 'Part'  and  has_aux_child == False ):
                        self.addChild(TextSpan._init("pS", "tag"))
                    else:
                        self.addChild(TextSpan._init("v2", "tag"))
                    self.addChild(
                        TextSpan._init(self.token.text_with_ws, self.token.dep_)
                    )

                elif (
                    self.token.tag_
                    in (
                        "VBD",
                        "VBP",
                        "VBZ",
                    )
                    and self.token.lemma_ != "wasn"
                ):  # Verb, past tense &  Verb, non-3rd person singular present
                    self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                    if token.dep_ == "conj":
                        isWithNoun = False

                        for child in self.token.children:
                            if child.dep_ in ("nsubjpass", "nsubj"):
                                isWithNoun = True
                                break

                        if token.i > 0 and isWithNoun:
                            self.addChild(
                                TextSpan._init(
                                    "V", "tag", self.getMorphology(self.token, "Tense")
                                )
                            )

                        else:
                            pass
                    else:
                        self.addChild(
                            TextSpan._init(
                                "V", "tag", self.getMorphology(self.token, "Tense")
                            )
                        )
                    self.addChild(
                        TextSpan._init(self.token.text_with_ws, self.token.dep_)
                    )
                    return
                else:
                    if self.token.lemma_ == "wasn":
                        self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                        self.addChild(TextSpan._init("st", "tag"))
                        self.addChild(
                            TextSpan._init(self.token.text_with_ws, self.token.dep_)
                        )
                    else:
                        self.textSpan = TextSpan._init(
                            text=token.text_with_ws, tag="Verb-Mark"
                        )
            elif (
                token.tag_
                in (
                    "VBP",
                    "VBD",
                    "VBZ",
                )
                and token.dep_ != "ROOT"
                and token.text
                in (
                    "wasn",
                    "isn",
                    "have",
                    "don",
                    "didn",
                    "doesn",
                    "haven",
                    "hasn",
                )
            ):

                for key, value in tag_questions.items():
                    if token.text in key:
                        self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                        self.addChild(TextSpan._init(value, "tag"))
                        self.addChild(
                            TextSpan._init(self.token.text_with_ws, self.token.dep_)
                        )
                        break

            elif token.pos_ in ("AUX", "VERB") and token.text == "m":
                self.textSpan = TextSpan._init(text=token.text_with_ws, tag="Verb-Mark")
            elif (
                token.head.dep_ == "pobj"
                or token.dep_ == "pobj"
                or (self.token.dep_ == "prep" and self.token.text == "according")
            ):
                self.textSpan = TextSpan._init(text=token.text_with_ws, tag=" ")
            else:
                self.pos_func_dict[token.pos_]()

        else:
            # Bug fix 22.09.23 They quit smoking for better health.
            has_dt_child = any(child.dep_ == 'det' for child in token.children)
            if (
                self.token.dep_ in ("xcomp", "dobj")
                and self.token.tag_ == "NN"
                and "ing" in self.token.text
            ) and ( self.token.dep_  == "dobj"  and has_dt_child == False):
                self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                self.addChild(TextSpan._init("pA", "tag"))
                self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))
            else:
                self.textSpan = TextSpan._init(
                    text=token.text_with_ws, tag=self.token.dep_
                )

    def enVerbAuxilary(self):
        if self.token.text in ("m", "ve", "ll", "d", "re", "s"):
            self.textSpan = TextSpan._init(
                text=self.token.text_with_ws, tag="Verb-Mark"
            )
        elif self.token.text == "nt":
            self.textSpan = TextSpan._init(text=self.token.text_with_ws, tag="Neg")
        else:
            tag: str = ""
            tense: str = ""
            tense = self.getMorphology(self.token, "Tense")

            lemma_modal_verbs = {
                "be": "H",
                "mustn": "M",
                "hadn": "Hr",
                "hasn": "Hr",
                "have": "Hr",
                "haven": "Hr",
                "will": "Hf",
                "shall": "Hf",
                "won": "Hf",
                "wont": "Hf",
            }

            tag = lemma_modal_verbs.get(self.token.lemma_, "H")

            if self.token.tag_ == "MD" and self.token.lemma_ not in lemma_modal_verbs:
                tag = "M"

            self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
            if self.token.text.startswith("'") or self.token.text.startswith("'"):
                self.addChild(TextSpan._init(" ", ""))
            self.addChild(TextSpan._init(tag, "tag", extra=tense))
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))

    def phrasalVerbParticle(self):
        # hands-on
        if self.token.tag_ == "RP":
            self.textSpan = TextSpan._init(text=self.token.text_with_ws, tag="")
        else:
            self.textSpan = TextSpan._init(text="", tag="PhrasalVerb")
            self.addChild(TextSpan._init(self.token.text_with_ws, "Verb-Mark"))

    def checkTagNeg(self, token: spacy.tokens.doc.Token, tag: str):
        tag: str = tag
        polarity: str = self.getMorphology(token, "Polarity")
        if polarity != None and polarity != "":
            tag = polarity
        else:
            if token.text.lower()[:2] == "no":
                tag = "Neg"
        return tag

    def enVerbParticiple(self):
        if self.token.tag_ == "DT":
            self.textSpan = TextSpan._init(text=self.token.text_with_ws, tag="")
        else:
            # Exception:  By the time I turn 30
            if self.token.tag_ == "CD":
                self.textSpan = TextSpan._init(self.token.text_with_ws, self.token.dep_)

            else:

                if self.token.tag_ == "NN":
                    self.textSpan = TextSpan._init(text=self.token.text, tag="")
                else:
                    self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
                    if self.token.pos_ == "ADJ" or (
                        (self.token.tag_ == "VBN" or self.token.tag_ == "JJ")
                        and self.token.dep_ == "acomp"
                    ):
                        if self.token.tag_ == "JJR" and self.token.head.dep_ == "ROOT":
                            self.addChild(TextSpan._init("p2", "tag"))
                        else:
                            # The water in the lake was non-potable, so we couldn 't drink it.
                            if self.token.text == "-" or (
                                self.token.i > 0
                                and self.token.doc[self.token.i - 1].text == "-"
                            ):
                                pass
                            else:
                                self.addChild(TextSpan._init("p2", "tag"))

                    else:
                        # 31.09.23 very down-to-earth

                        self.addChild(TextSpan._init("v2", "tag"))
                    self.addChild(
                        TextSpan._init(self.token.text_with_ws, self.token.dep_)
                    )

    def enVerbModal(self):
        tag: str = ""
        tense: str = ""
        tense = self.getMorphology(self.token, "Tense")

        if self.token.lemma_ in ("will", "shall"):
            tag = "Hf"
        elif self.token.lemma_ in ("be") or (
            self.token.lemma_ in ("get", "gets", "got", "gotten", "getting", "aren")
            and self.token.dep_ == "auxpass"
        ):
            tag = "st*" if self.token.dep_ == "auxpass" else "st"
        elif self.token.tag_ == "MD" and self.token.lemma_ == "won":
            tag = "Hf"
        elif self.token.tag_ == "MD":
            tag = "M"
        elif self.token.lemma_ in ("got", "get", "did", "do"):
            tag = "H"
        elif self.token.lemma_ in ("have"):
            tag = "Hr"

        next_token = self.token.nbor()
        if next_token.text == "m":
            tag = "H"

        self.textSpan = TextSpan._init(text=" ", tag="Verb-Mark")
        self.addChild(TextSpan._init(tag, "tag", tense))
        self.addChild(TextSpan._init(self.token.text_with_ws, self.token.dep_))

    def enVerbPart(self):
        tense: str = ""
        tense = self.getMorphology(self.token, "Tense")
        verbForm: str = ""
        verbForm = self.getMorphology(self.token, "VerbForm")
        tag: str = ""
        isInPassiv: bool = False
        isLet: bool = False
        isModalSpecial: bool = False

        if self.token.text.lower() == "isn" or self.token.lemma_.lower() == "be":
            self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
            self.addChild(TextSpan._init("st", "tag", extra=tense))
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.tag_))
            return

        for child in self.token.children:
            if child.dep_ == "nsubjpass":
                isInPassiv = True
                # isModalSpecial = True
                break

        if self.token.lemma_ == "let":
            self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
            self.addChild(TextSpan._init("H", "tag", extra=tense))
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.tag_))
            return

        # Exceptions
        if self.token.dep_ == "amod" and self.token.tag_ == "VBN":
            self.textSpan = TextSpan._init(text="", tag="")
            self.addChild(
                TextSpan._init(self.token.text_with_ws, self.token.tag_, extra=tense)
            )
            return None

        # Verb, gerund or present participle
        if self.token.tag_ == "VBG" and self.token.dep_ == "csubj":
            tag = "S"
        elif self.token.tag_ == "VBG":
            tag = "pA"

        elif self.token.lemma_ == "let" and isModalSpecial:
            self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
            self.addChild(TextSpan._init("H", "tag", extra=tense))
            self.addChild(TextSpan._init(self.token.text_with_ws, self.token.tag_))
            return

        # VBN	Verb, past participle
        elif self.token.tag_ in ("VB", "VBN", "VBD"):
            if (self.token.dep_ == "acl" and verbForm != "Inf") or (
                # Given the clues
                self.token.i == 0
                and verbForm != "Inf"
                and self.token.dep_ in ("ROOT", "prep")
            ):
                if isInPassiv == True:
                    tag = "v2"
                else:
                    tag = "pS"
            # Come shine or rain
            elif (
                (self.token.dep_ == "advcl" and self.token.pos_ != "VERB")
                or self.token.tag_ == "VBD"
            ) and verbForm != "Inf":
                tag = "V"
            elif (
                (self.token.dep_ == "advcl" or self.token.dep_ == "acl")
                and self.token.pos_ == "VERB"
                and verbForm == "Inf"
            ):
                tag = "v2"
            # Read the instructions, then complete the exercise.
            elif self.token.dep_ in ("ROOT", "dep") and self.token.tag_ == "VB":
                # Can you tell me where the meeting is?

                for child in self.token.children:
                    if child.dep_ == "aux" and (
                        child.tag_ in ("MD", "RB")
                        or child.lemma_
                        in ("do", "get", "doesn", "let", "don", "didn", "doesn")
                    ):
                        tag = "v2"
                if tag == "":
                    tag = "V"

            elif (
                self.getMorphology(self.token, "VerbForm") != "Part"
                and self.token.dep_ != "advcl"
                and isInPassiv == True
            ):
                for child in self.token.children:
                    if child.dep_ == "nsubjpass":
                        tag = "st*"
                        break
            else:
                isPs: bool = False
                if self.token.dep_ == "prep":
                    for child in self.token.children:
                        if child.dep_ == "prep":
                            isPs = True
                if isPs:
                    tag = "pS"
                else:
                    tag = "v2"
        elif verbForm == "Fin":
            tag = "st" if self.token.lemma_ in ("be", "weren", "aren") else "V"
        elif verbForm == "Inf":
            tag = "v2"

        self.textSpan = TextSpan._init(text="", tag="Verb-Mark")
        self.addChild(TextSpan._init(tag, "tag", extra=tense))
        self.addChild(TextSpan._init(self.token.text_with_ws, self.token.tag_))


class enSpan:
    nextTokenID: int = 0
 
    def __init__(self, document: spacy.tokens.doc.Doc):
        self.document = document
        self.textSpan = TextSpan._init(text="", tag="Sentence")

        # List of methods to process each token
        self.token_methods = [
            self.buildPunct,
            self.buildCasuativeObject,
            self.buildSpecialConstructs,
            self.buildParticle,
            self.buildTransitive,
            self.buildAppositiv,
            self.buildSubject,
            self.buildSubjectInPassiv,
            self.buildNominativPredicat,
            self.buildOther,
        ]

        self.process_tokens()

    def process_tokens(self):
        for token in self.document:
            if self.isNext(token.i):
                for method in self.token_methods:
                    method(token)

    def buildSubject(self, token: spacy.tokens.doc.Token):
        relcl_found = False

        # Bug / 21.02/23 Each sentence you explore

        # Check if a child of the token has dependency label "relcl"
        if (
            token.head.dep_ == "nsubj"
            and token.head.head.pos_ in ("AUX", "VERB")
            # Bug 28.09.23 My brother, who lives in New York, is visiting me next week.
            and token.i > 0
        ):
            for child in token.head.children:
                if child.dep_ == "relcl":
                    relcl_found = True
                    break
        if ( token.dep_ == "nsubj" or  token.dep_ == 'csubj' ) and token.head.pos_ in ("AUX", "VERB"):
            for child in token.children:
                if child.dep_ == "relcl":
                    relcl_found = True
                    break
        if (
            self.isNext(token.i)
            and token.dep_ != "relcl"
            # and ("self" not in token.text and "selves" not in token.text and token.dep_ != 'compound') 
            and (token.dep_ != "punct" and token.tag_ != "HYPH")
            and (
                (
                    token.dep_ == "nsubj"
                    and token.head.pos_ in ("VERB", "AUX")
                    and relcl_found == False
                )
                or (
                    token.head.dep_ == "nsubj"
                    and relcl_found == False
                    # exclusion
                    and (token.tag_ != "IN" and token.dep_ != "relcl")
                    and token.head.head.pos_ in ("VERB", "AUX")
                )
                or (
                    token.head.dep_ in ("poss", "nummod")
                    and token.head.head.dep_ == "nsubj"
                )
                or (
                    # + token.head.head.dep_ != 'ccomp' when Making our lives easier
                    (
                        token.dep_ == "nsubj"
                        and relcl_found == False
                        or (
                            token.head.dep_ == "nsubj"
                            and token.pos_ != "VERB"
                            # Bug 21.09.23 effects on menthal health
                            and token.dep_ != "prep"
                        )
                    )
                    and (token.doc[token.i - 1].dep_)
                    and token.i > 0
                )
            )
        ):
            stop_idx = token.head.i if token.dep_ == "nsubj" else token.head.head.i

            stop_idx = max(stop_idx, token.i, len(self.document))

            captured_tokens = []

            for i in range(token.i, stop_idx):

                if (
                    (
                        token.doc[i].dep_ in ("punct", "aux", "acomp")
                        and token.doc[i].text != "-"
                    )
                    or (token.doc[i].tag_ in ("WP$") and len(captured_tokens) > 0)
                    or (
                        token.doc[i].tag_ in ("WDT", "WP", "WP$")
                        and token.doc[i].head.dep_ == "relcl"
                    )
                    or (
                        token.doc[i].pos_ in ("VERB", "AUX")
                        # Bug fix on 22.09.23:  The cleaning agent was effective on stubborn stains.
                        and token.doc[i].dep_ != "amod"
                    )
                    or (
                        token.doc[i].head.dep_ == "relcl"
                        and token.doc[i].dep_ != "nsubj"
                        # The strategy that the coach used was innovative.
                        and (token.doc[i - 1].dep_ != "det" and i > 0)
                    )
                ):

                    break
                else:

                    captured_tokens.append(token.doc[i])
            # When transitive verb before, then do not put Subject by mistake
            if (
                (
                    token.i >= 1
                    and token.doc[token.i - 1].pos_ != "AUX"
                    and token.doc[token.i - 1].lemma_
                    and (
                        token.i < len(token.doc) - 1
                        and token.doc[token.i + 1].dep_ == "punct"
                    )
                    in (
                        "have",
                        "make",
                        "get",
                    )
                )
                or (
                    (
                        token.head.dep_ == "nsubj"
                        and token.head.head.dep_ == "ccomp"
                        and token.head.head.tag_ == "JJR"
                    )
                )
                or (
                    token.dep_ == "nsubj"
                    and token.head.dep_ == "ccomp"
                    and token.head.tag_ == "JJR"
                )
            ):
                pass
            else:
                self.textSpan.children.append(TextSpan._init("S", "tag"))
            for t in captured_tokens:
                tag_str = t.tag_ if t.tag_ in ("NN", "RB") else t.tag_ + "_" + t.dep_
                if t.dep_ == "neg":
                    tag_str = "Neg"
                text: str = ""
                if t.pos_ == "PRON" and (
                    t.doc[t.i + 1].text.startswith("'")
                    or t.doc[t.i + 1].text.startswith("’")
                ):
                    text = t.text_with_ws + " "
                else:
                    text = t.text_with_ws

                textSpan = TextSpan._init(text=text, tag=tag_str)
                self.textSpan.children.append(textSpan)
            if not captured_tokens:
                print("Error with token:", token.text)
            else:
                self.moveCursor(captured_tokens[-1].i)

    def buildAppositiv(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) and (
            token.dep_ == "appos" or token.head.dep_ == "appos"
        ):

            stop_idx = token.head.i if token.dep_ == "appos" else token.head.head.i
            stop_idx = max(stop_idx, token.i, len(self.document))
            captured_tokens = []
            for i in range(token.i, stop_idx):
                if (
                    token.doc[i].dep_ in ("punct", "aux")
                    and token.doc[i].tag_ != "HYPH"
                ) or token.doc[i].pos_ in (
                    "VERB",
                    "AUX",
                ):
                    break
                else:
                    captured_tokens.append(token.doc[i])

            for t in captured_tokens:
                tag_str = t.tag_ if t.tag_ == "NN" else t.tag_ + "_" + t.dep_
                textSpan = TextSpan._init(text=t.text_with_ws, tag=tag_str)
                self.textSpan.children.append(textSpan)
            if not captured_tokens:
                print("Error with token:", token.text)
            else:
                self.moveCursor(captured_tokens[-1].i)

    def buildSubjectInPassiv(self, token: spacy.tokens.doc.Token):
        if (
            self.isNext(token.i)
            and token.dep_ != "relcl"
            and (token.dep_ != "punct" and token.tag_ != "HYPH")
            and (
                token.dep_ == "nsubjpass"
                or (
                    token.head.dep_ == "nsubjpass"
                    and token.tag_ != "IN"
                    and token.dep_ != "relcl"
                )
                or (
                    # The employee who came late was reprimanded.
                    token.head.dep_ in ("poss", "nummod")
                    and token.head.head.dep_ == "nsubjpass"
                )
            )
        ):

            stop_idx = token.head.i if token.dep_ == "nsubjpass" else token.head.head.i
            stop_idx = max(stop_idx, token.i, len(self.document))
            captured_tokens = []
            for i in range(token.i, stop_idx):
                if (
                    (
                        token.doc[i].dep_ in ("punct", "aux")
                        and token.doc[i].tag_ != "HYPH"
                    )
                    or (
                        token.doc[i].tag_ in ("WDT", "WP", "WP$")
                        and token.doc[i].head.dep_ == "relcl"
                    )
                    or token.doc[i].pos_
                    in (
                        "VERB",
                        "AUX",
                    )
                ):
                    break
                else:
                    captured_tokens.append(token.doc[i])

            self.textSpan.children.append(TextSpan._init("S*", "tag"))
            for t in captured_tokens:
                tag_str = t.tag_ if t.tag_ == "NN" else t.tag_ + "_" + t.dep_

                if tag_str == "neg":
                    tag_str = "Neg"
                # "Neg"
                textSpan = TextSpan._init(text=t.text_with_ws, tag=tag_str)
                self.textSpan.children.append(textSpan)
            if not captured_tokens:
                print("Error with token:", token.text)
            else:
                self.moveCursor(captured_tokens[-1].i)

    def buildTransitive(self, token: spacy.tokens.doc.Token):
        if (
            self.isNext(token.i)
            and (
                token.dep_ == "quantmod"
                and token.head.dep_ == "nummod"
                and token.head.head.dep_ == "nsubj"
                and token.head.head.head.dep_ == "ccomp"
            )
            # I found the exam difficult
            or (
                token.head.dep_ == "nsubj"
                and token.head.head.dep_ == "ccomp"
                # I 'm conducting performance testing to ensure our application runs smoothly under heavy load.
                and token.head.head.head.dep_ != "ROOT"
                and token.head.head.head.dep_ != "advcl"
            )
        ):
            if token.dep_ == "nsubj":
                stop_idx = token.head.i
            elif token.head.dep_ == "nsubj":
                stop_idx = token.head.head.i
            elif token.head.head.dep_ == "nsubj":
                stop_idx = token.head.head.head.i

            captured_tokens = []
            for i in range(token.i, stop_idx):
                if token.doc[i].dep_ == "aux":
                    break
                elif token.doc[i].dep_ == "nsubj":
                    captured_tokens.append(token.doc[i])
                else:
                    captured_tokens.append(token.doc[i])
            # captured_tokens.append(token.doc[i + 1])
            for t in captured_tokens:
                tag_str = t.tag_ if t.tag_ == "NN" else t.tag_ + "_" + t.dep_
                textSpan = TextSpan._init(text=t.text_with_ws, tag=tag_str)
                self.textSpan.children.append(textSpan)
            if not captured_tokens:
                print("Error with token:", token.text)
            else:
                self.moveCursor(captured_tokens[-1].i)

    def buildNominativPredicat(self, token: spacy.tokens.doc.Token):
        if (
            self.isNext(token.i)
            and (
                token.text != "-"
                and (token.doc[token.i - 1].text != "-" and token.i > 0)
            )
            # What is this
            and (
                token.dep_ == "attr"
                or token.head.dep_ == "attr"
                # Bug fix 22.09.23:  He's both a painter and a writer
                or (token.head.head.dep_ == "attr" and token.head.dep_ == "conj")
            )
            # There are many reasons why I love living in the city.
            and token.dep_ not in ("preconj", "relcl", "acl", "prep", "punct", "cc")
        ):
            isLinked: bool = False
            for child in token.children:
                if child.dep_ in ("WP", "WP$"):
                    isLinked = True
                    break

            stop_idx = token.i if token.dep_ == "attr" else token.head.i
            captured_tokens = [token.doc[i] for i in range(token.i, stop_idx)]
            captured_tokens.append(token.doc[stop_idx])
            if token.tag_ not in ("WP", "WP$"):
                if token.doc[0].tag_ in ("WP", "WP$") and isLinked == False:
                    self.textSpan.children.append(TextSpan._init("S", "tag"))
                else:
                    self.textSpan.children.append(TextSpan._init("p2", "tag"))
            for t in captured_tokens:
                tag_str = t.tag_ if t.tag_ == "NN" else  t.dep_
                
                
                textSpan = TextSpan._init(text=t.text_with_ws, tag=tag_str)
                self.textSpan.children.append(textSpan)
            if not captured_tokens:
                print("Error with token:", token.text)
            else:
                self.moveCursor(captured_tokens[-1].i)

    # ----------------------------------> General Text Span
    def buildOther(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            self.textSpan.children.append(Word(token).get())
            self.moveCursor(token.i)
            
    def buildPunct(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True and token.text == ',':
            self.textSpan.children.append(TextSpan._init(text=token.text_with_ws, tag=""))
            self.moveCursor(token.i)
 

    def fillOverb(self, token: spacy.tokens.doc.Token, variant: int):
        textSpan = TextSpan._init(text="", tag="")

        if variant == 2:
            next_token = self.document[token.i + 1]
            textSpan.children = [
                TextSpan._init("O", "tag"),
                TextSpan._init(token.text_with_ws, token.dep_),
                TextSpan._init(next_token.text_with_ws, next_token.dep_),
                TextSpan._init(
                    "v2" if self.document[token.i + 2].tag_ == "VBN" else "V", "tag"
                ),
                TextSpan._init(self.document[token.i + 2].text_with_ws, "Verb-Mark"),
            ]
            self.textSpan.children.append(textSpan)
            self.moveCursor(token.i + 2)

        else:
            textSpan.children = [
                TextSpan._init("O", "tag"),
                TextSpan._init(token.text_with_ws, token.tag_),
                TextSpan._init("V", "tag"),
                TextSpan._init(self.document[token.i + 1].text_with_ws, "Verb-Mark"),
            ]
            self.textSpan.children.append(textSpan)
            self.moveCursor(token.i + 1)

    def buildCasuativeObject(self, token: spacy.tokens.doc.Token):
        if not self.isNext(token.i):
            return

        head = token.head
        head_head = head.head

        if token.i < 2:
            return

        # Common checks for both conditions
        if not head_head.dep_ == "ccomp" or not head_head.tag_ in ("VBN", "VB"):
            return
        if not head_head.pos_ == "VERB" or not head_head.head.pos_ == "VERB":
            return
        if head_head.head.lemma_ not in ("have", "make", "get"):
            return

        # Condition 1
        if (
            token.dep_ == "nsubj"
            and not token.text.startswith("'")
            and head.dep_ == "ccomp"
            and head.tag_ in ("VBN", "VB")
            and head.pos_ == "VERB"
        ):
            self.fillOverb(token, 1)

        # Condition 2
        elif head.dep_ == "nsubj":
            self.fillOverb(token, 2)

    def buildSpecialConstructs(self, token: spacy.tokens.doc.Token):
        if self.isNext(token.i) == True:
            captured_tokens = []
            # for granted ( exclusion )
            if (
                token.lemma_ == "for"
                and token.i + 1 < len(self.document)
                and self.document[token.i + 1].text == "granted"
            ):
                textSpan = TextSpan._init(text="", tag="")

                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                textSpan.children.append(
                    TextSpan._init(
                        self.document[token.i + 1].text_with_ws,
                        self.document[token.i + 1].tag_,
                    )
                )
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i + 1)

            if (
                token.lemma_ == "let"
                and token.i + 1 < len(self.document)
                and self.document[token.i + 1].text in ("’s", "'s")
            ):

                textSpan = TextSpan._init(text="", tag="Verb-Mark")
                textSpan.children.append(TextSpan._init("H", "tag"))
                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                textSpan.children.append(
                    TextSpan._init(
                        self.document[token.i + 1].text_with_ws,
                        self.document[token.i + 1].tag_,
                    )
                )
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i + 1)

            elif token.text in ("’s", "'s") and token.tag_ != "POS":
                if token.i > 0 and token.doc[token.i - 1].lemma_ == "let":
                    textSpan = TextSpan._init(token.text_with_ws, token.tag_)
                    self.textSpan.children.append(textSpan)
                    self.moveCursor(token.i)
                    return
                elif token.pos_ == 'AUX':
                    textSpan = TextSpan._init(text="", tag="Verb-Mark") 
                    textSpan.children.append(TextSpan._init(" ", ""))
                    textSpan.children.append(TextSpan._init("H", "tag"))
                    textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                    self.textSpan.children.append(textSpan)
                    self.moveCursor(token.i)
                else:
                    textSpan = TextSpan._init(text="", tag="Verb-Mark")
                    textSpan.children.append(TextSpan._init(" ", ""))
                    textSpan.children.append(TextSpan._init("st", "tag"))
                    textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                    self.textSpan.children.append(textSpan)
                    self.moveCursor(token.i)

            elif token.text == "n't":
                textSpan = TextSpan._init(text="", tag="Verb-Mark")
                textSpan.children.append(TextSpan._init(token.text_with_ws, "Neg"))

                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i)

            elif (
                token.text == "been"
                and token.dep_ == "ROOT"
                and token.i + 1 < len(self.document)
                and self.document[token.i + 1].dep_ == "acomp"
            ):

                textSpan = TextSpan._init(text="", tag="Verb-Mark")
                textSpan.children.append(TextSpan._init("v2", "tag"))
                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                textSpan.children.append(
                    TextSpan._init(
                        self.document[token.i + 1].text_with_ws,
                        self.document[token.i + 1].tag_,
                    )
                )
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i + 1)

            if token.text == "'ve" and token.i + 1 < len(self.document):
                textSpan = TextSpan._init(text="", tag="Verb-Mark")
                if token.dep_ == "ROOT":
                    textSpan.children.append(TextSpan._init("V", "tag"))
                else:
                    textSpan.children.append(TextSpan._init("Hr", "tag"))
                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i)

            if (
                token.text == "'"
                and token.i + 1 < len(self.document)
                and self.document[token.i + 1].text != "m"
                and token.dep_ == "aux"
                # and (token.i - 1 >= 0 and self.document[token.i - 1].tag_ != "MD")
            ):
                tag2: str = ""
                textSpan = TextSpan._init(text="", tag="Verb-Mark")
                if self.document[token.i + 1].text == "ve":

                    textSpan.children.append(TextSpan._init("Hr", "tag"))
                elif self.document[token.i + 1].text == "t":
                    pass
                else:
                    textSpan.children.append(TextSpan._init("H", "tag"))

                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))

                if self.document[token.i + 1].text == "t":
                    tag2 = "Neg"
                else:
                    tag2 = self.document[token.i + 1].tag_

                textSpan.children.append(
                    TextSpan._init(
                        self.document[token.i + 1].text_with_ws,
                        tag2,
                    )
                )

                if (
                    self.document[token.i + 1].text == "ve"
                    and self.document[token.i + 2].dep_ == "ROOT"
                    or (
                        self.document[token.i + 2].dep_ == "ccomp"
                        and self.document[token.i + 2].text == "been"
                    )
                ):
                    textSpan.children.append(TextSpan._init("v2", "tag"))
                    textSpan.children.append(
                        TextSpan._init(
                            self.document[token.i + 2].text_with_ws,
                            tag2,
                        )
                    )
                    self.moveCursor(token.i + 2)
                    return
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i + 1)

            # I'm very tired.
            elif (
                token.text == "'"
                and token.i + 1 < len(self.document)
                and self.document[token.i + 1].text == "m"
            ):

                textSpan = TextSpan._init(text="", tag="Verb-Mark")

                if (
                    token.tag_ == "VBP"
                    and self.document[token.i + 1].dep_ != "conj"
                    and self.document[token.i + 2].pos_ != "ADJ"
                ):
                    textSpan.children.append(TextSpan._init("H", "tag"))
                else:
                    textSpan.children.append(TextSpan._init("st", "tag"))
                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                textSpan.children.append(
                    TextSpan._init(
                        self.document[token.i + 1].text_with_ws,
                        self.document[token.i + 1].tag_,
                    )
                )
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i + 1)

            # Have to
            elif (
                token.tag_ in ("VBP", "VBZ", "VBD")
                and (token.lemma_ == "have" or token.lemma_ == "need")
                and self.document[token.i + 1].tag_ == "TO"
            ):
                textSpan = TextSpan._init(text="", tag="Verb-Mark")
                textSpan.children.append(TextSpan._init("M", "tag"))
                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i)
            # How many, how much
            elif (
                token.tag_ in ("WRB")
                and token.dep_ != "advmod"
                and self.document[token.i + 1].tag_ in ("JJ")
                and token.dep_ != "neg"
            ):
                textSpan = TextSpan._init(text="", tag=" ")
                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                textSpan.children.append(
                    TextSpan._init(
                        self.document[token.i + 1].text_with_ws,
                        self.document[token.i + 1].tag_,
                    )
                )
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i + 1)
            elif (
                token.text == "a"
                and token.head.text == "dime"
                and token.i + 3 < len(self.document)
                and self.document[token.i + 3].text
            ):
                textSpan = TextSpan._init(text="", tag=" ")
                textSpan.children.append(TextSpan._init(text="S", tag="tag"))
                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                textSpan.children.append(
                    TextSpan._init(self.document[token.i + 1].text_with_ws, "")
                )
                textSpan.children.append(
                    TextSpan._init(self.document[token.i + 2].text_with_ws, "")
                )
                textSpan.children.append(
                    TextSpan._init(self.document[token.i + 3].text_with_ws, "")
                )
                self.textSpan.children.append(textSpan)
                self.moveCursor(token.i + 3)

            elif (
                token.tag_ == "VBD"
                and token.text == "had"
                and self.document[token.i + 1].tag_ in ("RBR", "JJR", "RB")
                and (
                    self.document[token.i + 1].dep_ not in ("amod", "neg", "advmod")
                    or self.document[token.i + 1].text == "better"
                )
            ) and token.i + 1 < len(self.document):
                textSpan = TextSpan._init(text="", tag="Verb-Mark")
                textSpan.children.append(TextSpan._init("M", "tag"))
                textSpan.children.append(TextSpan._init(token.text_with_ws, token.tag_))
                textSpan.children.append(
                    TextSpan._init(
                        self.document[token.i + 1].text_with_ws,
                        self.document[token.i + 1].tag_,
                    )
                )

                if (
                    token.i != 0
                    and token.i + 2 < len(self.document)
                    and self.document[token.i + 2].dep_ == "neg"
                ):
                    self.textSpan.children.append(textSpan)
                    textSpan.children.append(
                        TextSpan._init(
                            self.document[token.i + 2].text_with_ws,
                            self.document[token.i + 2].tag_,
                            extra="neg",
                        )
                    )
                    textSpan.children.append(TextSpan._init("v2", "tag"))

                    textSpan.children.append(
                        TextSpan._init(
                            self.document[token.i + 3].text_with_ws,
                            self.document[token.i + 3].tag_,
                        )
                    )
                    self.moveCursor(token.i + 3)

                elif token.i == 0:
                    self.textSpan.children.append(textSpan)
                    textSpan = TextSpan._init(text="", tag="Verb-Mark")
                    textSpan.children.append(TextSpan._init("M", "tag"))
                    textSpan.children.append(
                        TextSpan._init(token.text_with_ws, token.tag_)
                    )
                    self.moveCursor(token.i + 1)

                elif token.i + 2 < len(self.document):
                    self.textSpan.children.append(textSpan)
                    textSpan.children.append(TextSpan._init("v2", "tag"))
                    textSpan.children.append(
                        TextSpan._init(
                            self.document[token.i + 2].text_with_ws,
                            self.document[token.i + 2].tag_,
                        )
                    )
                    self.moveCursor(token.i + 2)
                else:
                    self.textSpan.children.append(textSpan)
                    self.moveCursor(token.i + 1)

    def buildParticle(self, token: spacy.tokens.doc.Token):

        if not self.isNext(token.i):
            return

        if token.text.lower() in ("n’t", "not", "t") or token.dep_ == "neg":
            self.textSpan.children.append(TextSpan._init(token.text_with_ws, "Neg"))
            self.moveCursor(token.i)
            return

        # advcl: An adverbial clause
        if token.pos_ in ("PART") and token.head.dep_ in (
            "xcomp",
            "ccomp",
            "pcomp",
            "ROOT",
            "advcl",
            "relcl",
            "acl",
            # To create something new is..
            "csubj",
        ):
            doc = self.document
            next_token = doc[token.i + 1] if token.i + 1 < len(doc) else None
            next2_token = doc[token.i + 2] if token.i + 2 < len(doc) else None

            if next_token and next_token.tag_ == "WP":
                return

            textSpan = TextSpan._init(text="", tag="Verb-Mark")

            if token.tag_ == "TO" and token.i + 1 < len(self.document):
                # She wants to carefully plan
                if next_token.dep_ == "advmod" and next2_token != None:
                    children_data = [
                        ("vI", "tag"),
                        (token.text_with_ws, token.tag_),
                        (next_token.text_with_ws, next_token.tag_),
                        (next2_token.text_with_ws, next2_token.tag_),
                    ]
                else:

                    children_data = [
                        ("vI", "tag"),
                        (token.text_with_ws, token.tag_),
                        (next_token.text_with_ws, next_token.tag_),
                    ]
            else:
                tag = "vI" if token.head.dep_ == "xcomp" else "v2"
                children_data = [
                    (tag, "tag"),
                    (token.text_with_ws, token.tag_),
                    (token.head.text_with_ws, token.head.tag_),
                ]

            for text, tag in children_data:
                textSpan.children.append(TextSpan._init(text, tag))

            self.textSpan.children.append(textSpan)
            self.moveCursor(token.i + len(children_data) - 2)

    def getAdvmodTokens(self, token: spacy.tokens.doc.Token):
        advmod_tokens = []
        for child in token.children:
            if child.dep_ == "advmod":
                advmod_tokens.append(child)
                advmod_tokens.extend(self.getAdvmodTokens(child))
        return advmod_tokens

    # ----------------------------------> Morphology
    def getMorphology(self, token: spacy.tokens.doc.Token, aspect: str):
        return token.morph.to_dict().get(aspect)

    # ----------------------------------> Token-Cursor
    def moveCursor(self, tokenId: int):
        if tokenId >= self.nextTokenID:
            self.nextTokenID = tokenId + 1

    # ----------------------------------> Get Results
    def get(self):
        return self.textSpan

    # ----------------------------------> Next Iteration
    def isNext(self, id: int = 0):
        return True if (id == self.nextTokenID or self.nextTokenID == 0) else False
