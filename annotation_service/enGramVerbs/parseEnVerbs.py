from typing import List
import spacy
from spacy.language import Language
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
import os
from openai import OpenAI
import json

nlp_en = spacy.load("en_core_web_trf", exclude=["ner", "textcat"])

current_directory = os.path.dirname(__file__)
json_path = os.path.join(current_directory, 'verbs-in-use-firebase-adminsdk-1zvmr-b8e4a8d8fe.json')
 # Initialize OpenAI
 
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
cred = credentials.Certificate(json_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

 
class VerbModel(BaseModel):
    verb: str
    tense: str
    time: str
    modal: bool    
    aspect: str = ""
    verb_form: str = ""
    aux: bool
    start: int
    end: int

class Entity(BaseModel):
    sentence: str
    verbs: List[VerbModel]

class VerbResult(BaseModel):
    entities: List[Entity]

MODAL_VERBS = {
    "can": "can",
    "could": "could",
    "may": "may",
    "might": "might",
    "will": "will",
    "shall": "shall",
    "would": "would",
    "should": "should",
    "must": "must"
}

def extract_verbs(nlp, text: str) -> VerbResult:

    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents]
    
    entities = []
    
    for sentence in sentences:
        verbs = []
        for token in nlp(sentence):
            if token.pos_ in ["VERB", "AUX"]:
            # Extract basic attributes
                morph_features = token.morph.to_dict()
            
                tense = morph_features.get("Tense", "")
                time = "future" if token.text.lower() in ["will", "shall"]  else ''
                modal = token.lemma_ in MODAL_VERBS.values()
                aux = token.pos_ == "AUX"
                
                # Extract Aspect and VerbForm
                aspect = morph_features.get("Aspect", "")
                verb_form = morph_features.get("VerbForm", "")
                start = token.idx
                end = token.idx + len(token.text) 
                
                verbs.append(VerbModel(
                    verb=token.text,
                    tense=tense,
                    time=time,
                    modal=modal,    
                    aspect=aspect,
                    verb_form=verb_form,
                    aux=aux,
                    start=start,
                    end=end
                ))
        
        if verbs:
            entity = Entity(
                sentence=sentence,
                verbs=verbs
            )
            entities.append(entity)
 
    verb_result = VerbResult( entities=entities )
    
    return verb_result

 

def get_detailed_verb_info(verb: str) -> dict:
    prompt = f"""
    Provide detailed information about the verb "{verb}" in the following structured format and ensure the response is a valid JSON:

    - Definition: A brief definition of the verb, user-friendly and easy to read. If there are several meanings, list and explain.
    - Popularity: Decide if it is a frequent verb or not (high, medium, low).
    - Context: The context to use the verb, user-friendly and easy to read.
    - Prepositions: List cases where the verb is used with prepositions. If none, do not fill.
    - Collocations: List collocations where the verb is used. If none, do not fill.
    - Synonyms: List a few main synonyms of the verb. Do not use rare words.
    - Antonyms: List a few main antonyms of the verb. Do not use rare words.
    - Idioms: Provide idioms or collocations with a similar sense.
    - Family: In one String. If not, do not fill.
    - Conjugate: In one line.
    - Sentences: Provide 15 sentences in different tenses, times, questions, and conditionals, from easy to more complex examples. Only sentences, no additional comments.

    Ensure the response is in valid JSON format as shown in the example response.

    Example response format:

    {{
      "verb": "run",
      "popularity": "high",
      "definition": [
        "To move swiftly on foot.",
        "To manage or operate."
      ],
      "context": "Used to describe physical movement or management/operation of something.",
      "prepositions": [
        {{
          "preposition": "to",
          "example": "He ran to the store."
        }},
        {{
          "preposition": "with",
          "example": "She runs with a group of friends."
        }}
      ],
      "collocations": [
        {{
          "phrase": "run smoothly",
          "meaning": "to operate without problems.",
          "example": "The machine runs smoothly."
        }},
        {{
          "phrase": "run late",
          "example": "They are running late."
        }}
      ],
      "synonyms": [
        "sprint",
        "manage"
      ],
      "antonyms": [
        "walk",
        "halt",
        "stop"
      ],
      "idioms": [
        {{
          "idiom": "run out of steam",
          "meaning": "to lose energy or motivation."
        }}
      ],
      "family": "run (verb), running (noun), runs, ran, run (verb forms)",
      "conjugate": "run (base) / runs (present) / ran (past) / run (past participle)",
      "irregular": "yes",
      "irregular_forms": {{
        "base_form": "run",
        "past_simple": "ran",
        "past_participle": "run"
      }},
      "sentences": [
        "I run quickly.",
        "I would have run faster if I had known the time."
        // ... 13 more sentences
      ]
    }}
    """
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an assistant to learn English, be accurate in Grammar."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=2500,
        temperature=1,
    )
    try:
        # Parse JSON response into a Python dictionary
        response_content = response.choices[0].message.content.strip()
        print(f"API Response Content: {response_content}")  # Log the raw response content
        response_data = json.loads(response_content)
        return response_data
    except json.JSONDecodeError as json_err:
        print(f"JSONDecodeError: {json_err}")
        print(f"Raw response content: {response_content}")  # Print the raw response content for debugging
    except (KeyError, IndexError) as e:
        print(f"Error accessing response data: {e}")
        print(f"Response structure: {response}")
    return None
   
def save_verb_info_to_firestore(verb_info):
    try:
        # Add a new document with a generated ID to the 'verbs' collection
        db.collection('verbs').add(verb_info)
        print("Verb information saved successfully!")
    except Exception as e:
        print(f"Error saving verb information: {str(e)}")

#-----------------------------------------------------------------------------------------------
#                                               MAIN ------------------------------------------- 
#-----------------------------------------------------------------------------------------------
verb_list = [
  # "begin",

# "differentiate",
# "synthesize",
# "shake",
# "bring",
# "result",
# "continue",
# "ask",
# "suspect",
# "look after",
# "mind",
# "indicate",
# "investigate",
# "behave",
# "sound",
# "benefit",
# "express",
# "rush",
# "arrange",
# "finish",
# "provide",
# "intend",
# "employ",
# "trade",
# "protect",
# "shoot",
# "site",
# "view",
# "retain",
# "service",
# "suffer",
# "enable",
# "suggest",
# "possess",
# "couple",
# "supply",
# "believe",
# "fit",
# "book",
# "divide",
# "smell",
# "lack",
# "reach",
# "identify",
# "select",
# "compare",
# "determine",
# "do",
# "recommend",
# "pass",
# "appeal",
# "according",
# "drive",
# "procrastinate",
# "push",
# "raise",
# "rationalize",
# "explain",
# "ride",
# "hang",
# "slide",
# "might",
# "may",
# "copy",
# "expect",
# "print",
# "pack",
# "formulate",
# "operate",
# "discover",
# "imagine",
# "matter",
# "conclude",
# "perpetuate",
# "damage",
# "cause",
# "waste",
# "disseminate",
# "reconcile",
# "pull",
# "assess",
# "connect",
# "attract",
# "narrow",
# "note",
# "structure",
# "fail",
# "frame",
# "reserve",
# "quit",
# "document",
# "remaining",
# "bet",
# "approve",
# "inform",
# "desire",
# "log",
# "size",
# "suppose",
# "wonder",
# "underscore",
# "risk",
# "calculate",
# "reflect",
# "exit",
# "influence",
# "calendar",
# "being",
# "nail",
# "discuss",
# "hit",
# "go",
# "strike",
# "grow",
# "issue",
# "own",
# "tie",
# "remind",
# "range",
# "hunt",
# "attempt",
# "place",
# "carry",
# "send",
# "orchestrate",
# "relieve",
# "tend",
# "consent",
# "try",
# "miss",
# "avoid",
# "act",
# "search",
# "compile",
# "estimate",
# "replace",
# "reply",
# "die",
# "save",
# "advance",
# "park",
# "find",
# "adopt",
# "be",
# "style",
# "press",
# "rise",
# "comprehend",
# "relate",
# "credit",
# "contrast",
# "clarify",
# "flow",
# "consist",
# "acquire",
# "enter",
# "punch",
# "appear",
# "want",
# "apply",
# "turn",
# "discipline",
# "recognize",
# "pursue",
# "arrive",
# "handle",
# "look forward to",
# "appropriate",
# "organized",
# "care",
# "fill",
# "make",
# "worry",
# "offer",
# "manage",
# "taste",
# "would",
# "pair",
# "proliferate",
# "conduct",
# "take over",
# "doubt",
# "tap",
# "cry",
# "associate",
# "elaborate",
# "organize",
# "ignore",
# "hurt",
# "represent",
# "join",
# "generate",
# "disagree",
# "hook",
# "challenge",
# "roll",
# "execute",
# "sugar",
# "land",
# "enhance",
# "give",
# "speak",
# "image",
# "consolidate",
# "depend",
# "introduce",
# "feel",
# "work out",
# "hypothesize",
# "emphasize",
# "register",
# "bed",
# "word",
# "admit",
# "command",
# "belt",
# "emancipate",
# "collect",
# "make up",
# "mean",
# "get",
# "obtain",
# "call off",
# "prepare",
# "look",
# "practice",
# "consult",
# "chain",
# "shift",
# "pick",
# "debate",
# "achieve",
# "seem",
# "campaign",
# "appreciate",
# "suit",
# "mark",
# "list",
# "follow",
# "bring up",
# "write",
# "wrap",
# "hire",
# "extend",
# "loan",
# "think",
# "prompt",
# "sit",
# "gather",
# "delegate",
# "refuse",
# "reference",
# "relax",
# "exist",
# "involve",
# "read",
# "cake",
# "floor",
# "pause",
# "fly",
# "decide",
# "foot",
# "closed",
# "train",
# "see",
# "confirm",
# "interview",
# "position",
# "count",
# "examine",
# "talk",
# "exercise",
# "earn",
# "shine",
# "include",
# "dry",
# "install",
# "deliver",
# "teach",
# "accomplish",
# "borrow",
# "distance",
# "effect",
# "gain",
# "leave",
# "process",
# "combine",
# "participate",
# "rice",
# "apologize",
# "project",
# "delay",
# "profit",
# "pressure",
# "perfect",
# "choose",
# "accept",
# "force",
# "luck",
# "instruct",
# "attach",
# "contest",
# "belong",
# "hate",
# "insist",
# "kick",
# "burn",
# "forget",
# "anticipate",
# "perform",
# "state",
# "receive",
# "ask",
# "fall",
# "run into",
# "related",
# "survive",
# "schedule",
# "regret",
# "suck",
# "partner",
# "pray",
# "base",
# "touch",
# "look for",
# "come across",
# "pay",
# "criticize",
# "keep",
# "lock",
# "respect",
# "recover",
# "beach",
# "bear",
# "describe",
# "demonstrate",
# "incorporate",
# "tell",
# "ought",
# "distribute",
# "insist on",
# "please",
# "mention",
# "buy",
# "resolve",
# "cut down on",
# "rate",
# "differ",
# "submit",
# "lose",
# "finalize",
# "invest",
# "break",
# "affect",
# "bench",
# "sing",
# "foster",
# "spring",
# "accuse",
# "field",
# "remember",
# "point",
# "stress",
# "come up with",
# "inspect",
# "beat",
# "drop",
# "guarantee",
# "celebrate",
# "let",
# "guide",
# "company",
# "question",
# "block",
# "have",
# "end",
# "lead",
# "retire",
# "type",
# "release",
# "translate",
# "born",
# "lay",
# "find out",
# "cook",
# "sell",
# "light",
# "mediate",
# "obfuscate",
# "finger",
# "laugh",
# "implement",
# "respond",
# "require",
# "guess",
# "sleep",
# "contain",
# "imply",
# "hurry",
# "pretend",
# "take off",
# "track",
# "rely",
# "advanced",
# "convince",
# "analyze",
# "crash",
# "take",
# "persuade",
# "drink",
# "maintain",
# "impact",
# "add",
# "announce",
# "supervise",
# "conflict",
# "account",
# "spell",
# "expose",
# "create",
# "kiss",
# "pick up",
# "settle",
# "dream",
# "check in",
# "focus",
# "encourage",
# "refer",
# "bill",
# "spend",
# "claim",
# "cancel",
# "listen",
# "purchase",
# "sentence",
# "lesson",
# "spread",
# "engage",
# "serve",
# "steal",
# "adapt",
# "compete",
# "put",
# "contact",
# "excuse",
# "brain",
# "discount",
# "turn up",
# "allow",
# "fold",
# "balance",
# "target",
# "access",
# "arise",
# "pitch",
# "figure out",
# "quote",
# "prevent",
# "bridge",
# "live",
# "evaluate",
# "carry on",
# "come",
# "sink",
# "swing",
# "screen",
# "become",
# "improve",
# "thank",
# "negotiate",
# "seek",
# "collaborate",
# "grade",
# "hide",
# "keep on",
# "react",
# "hesitate",
# "theorize",
# "face",
# "propose",
# "assure",
# "advantage",
# "consider",
# "establish",
# "interpret",
# "rent",
# "group",
# "stick",
# "destroy",
# "complain",
# "qualify",
# "score",
# "coach",
# "justify",
# "address",
# "blow",
# "attend",
# "illustrate",
# "race",
# "remain",
# "hear",
# "wash",
# "grab",
# "enjoy",
# "develop",
# "kill",
# "impress",
# "progress",
# "reason",
# "jump",
# "to have",
# "put off",
# "struggle",
# "ensure",
# "expand",
# "permit",
# "validate",
# "catch",
# "concentrate",
# "scale",
# "warn",
# "advocate",
# "convert",
# "prove",
# "set",
# "happen",
# "succeed",
# "specify",
# "assume",
# "shut",
# "turn down",
# "figure",
# "understand",
# "admire",
# "limit",
# "plant",
# "form",
# "contribute",
# "complete",
# "stand",
# "learn",
# "commit",
# "feature",
# "solve",
# "trouble",
# "post",
# "open",
# "feed",
# "adjust",
# "hold",
# "dare",
# "abuse",
# "notice",
# "rain",
# "coordinate",
# "like",
# "bother",
# "invite",
# "craft",
# "stay",
# "innovate",
# "warm",
# "give up",
# "repeat",
# "pop",
# "shall",
# "demand",
# "agree",
# "argue",
# "owe",
# "communicate",
# "facilitate",
# "weight",
# "display",
# "lift",
# "wear",
# "explore",
# "approach",
# "produce",
# "exemplify",
# "be supposed to",
# "host",
# "upset",
# "smile",
# "sense",
# "realize",
# "must",
# "go",
# "lie",
# "brush",
# "wait",
# "afford",
# "reveal",
# "match",
# "overcome",
# "know",
# "weigh",
# "name",
# "hold on",
# "substantiate",
# "eat",
# "remove",
# "stretch",
# "prefer",
# "say",
# "check out",
# "picture",
# "research",
# "verify",
# "set up",
# "gear",
# "meet",
# "mix",
# "prioritize",
# "break down",
# "reduce",
# "check",
# "wake",
# "hope",
# "throw",
# "board",
# "exchange",
# "share",
# "escape",
# "vary",
# "surround",
# "exact",
# "advise",
# "allocate",
# "articulate",
# "assign",
# "authorize",
# "forecast",
# "increase",
# "initiate",
# "integrate",
# "measure",
# "monitor",
# "outline",
# "oversee",
# "plan",
# "present",
# "report",
# "review",
# "strategize",
# "summarize",
# "support",
# "sustain",
# "transmit",
# "build",
# "change",
# "clean",
# "close",
# "fix",
"help",
"lend",
"need",
"play",
"promise",
"run",
"show",
"start",
"study",
"travel",
"use",
"walk",
"watch",
"win",
"work",
"absorb",
"distinguish",
"draw",
"eliminate",
"emerge",
"entitle",
"disappear",
"design",
"deserve",
"deny",
"cut",
"cross",
"control",
"construct",
"constitute",
"confront",
"commit ",
"charge" 
]  

for index, verb in enumerate(verb_list, start=1):
    print(f"Processing verb {index} of {len(verb_list)}: {verb}")
    content = get_detailed_verb_info(verb)

    if content:
        sentences = content.get('sentences', [])
        text = "\n".join(sentences)
        extracted_verbs = extract_verbs(nlp_en, text)
        print(f"Extracted Verbs for {verb}: {extracted_verbs}")

        # Prepare Firestore document data
        verb_info = {
            "language": 'enGram',
            "verb": content.get('verb', ""),
            "popularity": content.get('popularity', ""),
            "definition": content.get('definition', ""),
            "context": content.get('context', ""),
            "prepositions": content.get('prepositions', []),
            "collocations": content.get('collocations', []),
            "synonyms": content.get('synonyms', []),
            "antonyms": content.get('antonyms', []),
            "idioms": content.get('idioms', []),
            "family": content.get('family', ""),
            "conjugate": content.get('conjugate', ""),
            "irregular": content.get('irregular', ""),
            "irregular_forms": content.get('irregular_forms', []),
            "verbs": [entity.dict() for entity in extracted_verbs.entities]
        }

        # Save to Firestore
        save_verb_info_to_firestore(verb_info)
    
    else:
        print(f"Failed to retrieve verb information for {verb}.")

print("All verbs processed.")
 
