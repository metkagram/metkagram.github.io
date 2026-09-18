import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// One-off, idempotent editorial integration. Existing patterns and URLs are preserved.
const root = process.cwd();
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const write = (p, value) => fs.writeFileSync(path.join(root, p), JSON.stringify(value, null, 2) + '\n');
const families = {
 GFA: ['Time and aspect', 'Время и вид действия', 'Первый опыт сейчас|Первый опыт в прошлом|Длительность до события|Завершение к будущему моменту|Будущая накопленная длительность|Прерванное намерение|Несостоявшееся намерение|Будущее глазами рассказчика|Несостоявшийся план|Ещё не выполненное действие|Время с последнего случая|Отсутствие события с прошлого момента|Завершённое предварительное действие|Скорое ожидаемое событие|Запоздалое осознание|Повторение с эмоциональной оценкой|Вежливая предварительная просьба|Ожидаемый ход будущих событий|Завершение до прошлого момента|Повторяющийся опыт до настоящего'],
 GFB: ['Modal scope and past inference', 'Модальность и выводы о прошлом', 'Сделано без необходимости|Не было необходимости|Вывод о прошлом процессе|Исключение прошлого процесса|Возможное объяснение процесса|Чем следовало заниматься|Нереализованная возможность в пассиве|Возможное прошлое событие в пассиве|Невыполненная обязанность в пассиве|Уверенный вывод в пассиве|Ожидаемое завершение к сроку|Правдоподобная уступка|Разумный запасной вариант|Лишняя осторожность не помешает|Вывод не обязателен|Возможно, действие не произошло|Отказ в прошлом|Упрёк за неверное решение|Предостережение с had better|Откуда было знать'],
 GFC: ['Conditions and counterfactuals', 'Условия и нереальные ситуации', 'Если бы не нынешний фактор|Если бы не прошлый фактор|Прошлая причина — нынешний результат|Постоянное свойство — прошлый результат|Условие с начальным should|Гипотетическое будущее с were|Прошлое условие с инверсией had|Отрицание в условной инверсии|Случайное возможное событие|Даже другое прошлое не помогло бы|Результат не зависит от ответа|Условие с provided that|Краткое условие с but for|Подразумеваемое условие с otherwise|Готовность человека как условие|Сожаление о прошлом|Предпочтение о чужом прошлом поступке|Уже пора действовать|Мысленный эксперимент|Желаемое изменение поведения'],
 GFD: ['Comparison and degree', 'Сравнения и степень', 'Далеко не равная степень|Сравнение размеров в несколько раз|Сравнение количества предметов|Сравнение объёма и времени|Всего лишь указанное количество|Целых столько объектов|Никакого улучшения|Есть ли хоть какая-то разница|Выбор лучшего из двух|Один из лучших в личном опыте|Меньше действия — меньше ошибок|Противоположные изменения|Не хуже, а возможно, лучше|Степень соответствия категории|Скорее одно, чем другое|Сравнение с нереальным прошлым|Реальная степень и впечатление|Всё больше и больше|Больше, чем возможно обработать|Обстоятельство усиливает качество'],
 GFE: ['Quantification and agreement', 'Количество и согласование', 'Не все — не значит никто|Нельзя оба одновременно|Ни один из двух|Любой из двух|Каждый элемент отдельно|Несколько объектов: a number of|Само количество: the number of|Более одного: единственное число|Каждый пятый: согласование|Всё неисчисляемое: единственное число|Little: ресурса почти нет|A little: немного ресурса есть|Few: объектов слишком мало|A few: несколько объектов есть|Оба участника: множественное число|Один из двух вариантов|Ни один вариант без второго not|As well as не меняет подлежащее|Один из людей, которые знают|Единственный, кто знает'],
 GFF: ['Negation, inversion and focus', 'Отрицание, инверсия и акцент', 'Только после события: not until|Только после действия: only after|Только таким способом: only by|Ни при каких обстоятельствах|Ни на одном этапе|Не только, но и: инверсия|Я и не подозревал|Не успел, как: no sooner|Едва произошло: hardly|Никогда раньше|Настолько выраженный признак|Такой масштаб явления|Акцент на сроке без инверсии|Нужно именно это|Я всего лишь сделал|Не это, а другое|Меньше всего хочется|Не обязательно|Вместо ожидаемого — обратное|Совсем не такое качество'],
 GFG: ['Relative and nominal clauses', 'Относительные и именные придаточные', 'Принадлежность с whose|Предлог перед whom|Предлог перед which|Which относится ко всему событию|Часть группы людей|Ни один из названных предметов|К указанному будущему моменту|В этот момент рассказа|Кто бы ни выполнил условие|Всё, что нужно|Выбор из известного набора|Всё придаточное как подлежащее|What после предлога|Whether-придаточное как подлежащее|Факт как именной блок|Возможность без утверждения факта|Вопрос о выборе действия|Способ с the way in which|Причина названа и раскрыта|Опущенное местоимение и конечный предлог'],
 GFH: ['Infinitive tense, voice and subject control', 'Время, залог и исполнитель инфинитива', 'Кажется, действие уже произошло|Похоже на текущий процесс|Похоже на длительный прошлый процесс|Утверждение о прошлом пассивном событии|Предполагаемое наличие|Предмет легко обработать|Оценка действия для человека|Оценка поступка человека|Инфинитивный блок как подлежащее|Слишком трудно для исполнителя|Достаточная степень для действия|Неожиданный результат с only to|Отрицательная цель|Цель с другим исполнителем|Первый объект пассивного действия|Предмет или человек для действия|Не осталось другого выбора|Предпочтительный прошлый выбор|Слишком важно, чтобы не сделать|Выбор между инфинитивами'],
 GFI: ['Gerund contrasts and participial clauses', 'Герундий и причастные конструкции', 'Remember doing: помнить эпизод|Remember to: не забыть сделать|Stop doing: прекратить действие|Stop to: остановиться ради действия|Try doing: проверить способ|Try to: попытаться достичь цели|Regret doing: сожалеть о поступке|Regret to: сообщить плохую новость|Mean doing: действие влечёт следствие|Mean to: намереваться|Go on doing: продолжать то же|Go on to: перейти к следующему|Без пассивного предварительного действия|Реакция на прошлое пассивное событие|Предварительно завершённое действие|Не получив результата|Получив воздействие, действовать|Реакция сразу после обращения|With и отдельный активный участник|With и завершённое состояние'],
 GFJ: ['Passive, causative and perception', 'Пассив, побуждение и восприятие', 'Действие над предметом идёт сейчас|Пассивное завершение к будущему сроку|Событийный пассив с get|Заказать услугу|Нежелательное событие с имуществом|Добиться выполнения работы|Поручить названному человеку|Убедить человека действовать|Причина заставляет действовать|Заставили: to возвращается|Разрешить человеку|Разрешили: be allowed to|Наблюдать процесс|Увидеть событие целиком|О событии свидетельствуют в пассиве|Передать сообщение без источника|Сообщение о прошлом действии|Предполагаемое наличие в пассиве|Need doing с пассивным смыслом|Получатель как подлежащее пассива'],
 GFK: ['Reporting and clause complements', 'Косвенная речь и дополнения', 'Передать отрицательное указание|Косвенный вопрос о прошлом|Косвенный wh-вопрос без инверсии|Объяснить, как выполнить|Событие до момента сообщения|Будущий процесс из прошлого|Будущее завершение из прошлого|Рассказ о прошлой длительности|Сохранить настоящее для актуального факта|Передать прошлую обязанность|Передать вывод с must|Передать нереальное прошлое|Рекомендация с subjunctive|Настаивать на истинности факта|Требование с неизменяемым be|Совет конкретному человеку|Признать прошлое действие|Обвинить в действии|Предостеречь от действия|Извиниться за прошлое действие'],
 GFL: ['Questions, tags and ellipsis', 'Вопросы, хвостики и сокращения', 'Отрицательный вопрос и ожидание|Everyone и хвостик с they|Особое сочетание I am — arent I|Предложение с shall we|Просьба с will you|Положительный хвостик после hardly|There остаётся в хвостике|Удивлённый переспрос|Вежливый вложенный вопрос|Вопрос к подлежащему без do|Вопрос к дополнению с did|Предлог в конце вопроса|Утвердительное присоединение с so|Отрицательное присоединение с neither|Заменить утверждение словом so|Надеюсь, нет: hope not|Заменить действие через do so|Инфинитив опущен, to остаётся|Если да: if so|Если нет: if not'],
 GFM: ['Noun phrases and reference', 'Именные группы и отсылки', 'Один из моих знакомых: of mine|Ещё один или другой: another|Другие предметы: other|Оставшийся из двух: the other|Одни и другие без повтора имени|Such a с исчисляемым существительным|Such без a с массой и множеством|Too перед прилагательным и артиклем|As good a reason: порядок артикля|Восклицание с what|Прилагательное называет группу людей|Мера как составное прилагательное|Длительность с притяжательным апострофом|Замена существительного через one|That и those в сравнении|Both и all перед принадлежностью|Единица неисчисляемого|Any означает любой|Some перед числом: примерно|Either side означает обе стороны'],
 GFN: ['Concession, cause and circumstance', 'Уступка, причина, цель и обстоятельства', 'Despite перед целым придаточным|Несмотря на завершённое действие|Although без подлежащего и be|Сопоставление с whereas|Как бы ни менялась степень|Какой бы вариант ни выбрали|Как бы ни ценил предложение|Признак вынесен перед though|В том отношении, что|Не по этой причине, а по другой|Теперь, когда ситуация изменилась|Учитывая исходную предпосылку|Цель с другим исполнителем и could|Мера предосторожности на будущее|Мера предосторожности из прошлого|Впечатление о более раннем событии|Нереальное сравнение с were|Утверждение ограничено степенью|Исключение в виде придаточного|Отвергнутый вариант перед выбранным'],
 GFO: ['German-led grammatical flexibility', 'Немецкие конструкции и английские параллели', 'Nicht brauchen с zu: нет необходимости|Sich lassen: можно сделать|Sein zu: требуется выполнить|Haben zu: исполнитель обязан|Gehören с причастием: стоит сделать|Bekommen-пассив получателя|Sollen передаёт чужие сведения|Wollen передаёт заявление человека|Dürfte выражает вероятность|Mögen вводит уступку|Je nachdem ob: зависит от ответа|Es sei denn: порядок главного предложения|Zumal: дополнительная причина|Umso ... als: причина усиления|Damit rechnen, dass: ожидать|Darauf ankommen, ob: что важно|Модальные инфинитивы в придаточном|Перфект каузативного lassen|Распространённое причастие перед именем|Zu-причастие для предстоящей задачи']
};
const corrections = new Map([
 ['Она получила больше вопросов, чем вообще могла ответить.', 'Она получила столько вопросов, что ответить на все было невозможно.'],
 ['Это настолько ясное объяснение, насколько мы можем дать.', 'Это самое ясное объяснение, которое мы можем дать.'],
 ['Ich hätte lieber gewartet, als die Entscheidung überstürzt zu haben.', 'Ich hätte lieber gewartet, statt die Entscheidung zu überstürzen.'],
 ['Sie wäre lieber zu Hause geblieben, als den letzten Zug verpasst zu haben.', 'Sie wäre lieber zu Hause geblieben, statt den letzten Zug zu verpassen.'],
 ['Wir hätten lieber zweimal gefragt, als die Aufgabe missverstanden zu haben.', 'Wir hätten lieber zweimal gefragt, statt die Aufgabe misszuverstehen.'],
 ['Beide meine Eltern reisen lieber mit dem Zug.', 'Meine beiden Eltern reisen lieber mit dem Zug.'],
 ['Beide ihre Vorschläge waren praktisch.', 'Ihre beiden Vorschläge waren praktisch.'],
 ['She brought two maps, none of which showed the new road.', 'She brought three maps, none of which showed the new road.'],
 ['Она принесла две карты, ни на одной из которых не было новой дороги.', 'Она принесла три карты, ни на одной из которых не было новой дороги.'],
 ['Sie brachte zwei Karten mit, von denen keine die neue Straße zeigte.', 'Sie brachte drei Karten mit, von denen keine die neue Straße zeigte.'],
 ['The reason why she left early was that her train had been changed.', 'The reason why she left early was that the departure time of her train had been changed.'],
 ['Der Grund, warum sie früher ging, war, dass ihre Zugverbindung geändert worden war.', 'Der Grund, warum sie früher ging, war, dass die Abfahrtszeit ihres Zuges geändert worden war.'],
 ['The method may be simple, but it is not careless.', 'The explanation may be brief, but it is not superficial.'],
 ['Метод, возможно, прост, но не небрежен.', 'Объяснение, возможно, краткое, но не поверхностное.'],
 ['Die Methode mag einfach sein, aber sie ist nicht nachlässig.', 'Die Erklärung mag kurz sein, aber sie ist nicht oberflächlich.'],
 ['Er entschuldigte sich dafür, uns warten gelassen zu haben.', 'Er entschuldigte sich dafür, dass wir auf ihn hatten warten müssen.']
]);
function correct(value) {
 if (typeof value === 'string') return corrections.get(value) ?? value;
 if (Array.isArray(value)) return value.map(correct);
 if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,correct(v)]));
 return value;
}
const asPatterns = value => Array.isArray(value) ? value : value.patterns;
const reference = read('data/patterns/TAS.json');
assert.ok(Array.isArray(asPatterns(reference)), 'Unknown canonical shard format; no changes made');
const registryPath = 'data/practice-extensions.json';
const registry = read(registryPath);
assert.ok(Array.isArray(registry.sets), 'Unknown extension registry format');
const source = fs.readFileSync('src/content.mjs', 'utf8');
const groupCandidates = [...source.matchAll(/['"](data\/[^'"]*groups[^'"]*\.json)['"]/g)].map(m => m[1]);
for (const filename of fs.readdirSync('data')) if (/group.*\.json$/i.test(filename)) groupCandidates.push('data/' + filename);
let groupFile, groupDocument, groups;
for (const file of [...new Set(groupCandidates)]) {
 if (!fs.existsSync(file)) continue;
 const doc = read(file); const items = Array.isArray(doc) ? doc : doc.groups;
 if (Array.isArray(items) && items.every(g => typeof g?.id === 'string')) { groupFile=file; groupDocument=doc; groups=items; break; }
}
const prepared=[];
for (const [family, [enTitle, ruTitle, titleString]] of Object.entries(families)) {
 const filename=`data/patterns/${family}.json`;
 const input=read(filename); const patterns=correct(asPatterns(input)); const titles=titleString.split('|');
 assert.equal(patterns.length,20,`${family}: expected 20 patterns`);
 assert.equal(titles.length,20,`${family}: expected 20 titles`);
 for (const [i,p] of patterns.entries()) {
  assert.equal(p.id, family + String(i+1).padStart(3,'0'));
  p.set_id=family; p.title_ru=titles[i]; p.title_en=p.group_title || enTitle;
  p.group_id=family;
  assert.ok(['B2','C1'].includes(p.level));
  assert.deepEqual(p.langs.map(l=>l.lang).sort(),['de','en']);
  for (const l of p.langs) {
   const examples=[{text:l.example,translation_ru:l.translation},...l.examples];
   assert.equal(examples.length,3,`${p.id}/${l.lang}: expected 3 examples`);
   assert.equal(new Set(examples.map(x=>x.text.trim().toLowerCase())).size,3);
   for(const e of examples) { assert.ok(e.text?.trim()); assert.match(e.translation_ru,/\p{Script=Cyrillic}/u); }
  }
  if(p.id==='GFL008') p.langs.find(l=>l.lang==='de').formula='Subject + finite verb in second position + ... + wh-phrase + remaining verb parts?';
  if(p.id==='GFH018') p.langs.find(l=>l.lang==='de').formula='Subject + hätte(n)/wäre(n) lieber + participle, statt + zu-infinitive';
  if(p.id==='GFM016') {
   p.langs.find(l=>l.lang==='de').formula='Possessive determiner + beide + plural noun / alle + possessive determiner + plural noun';
   if (!p.logic.metaphor_ru.includes('meine beiden Eltern')) p.logic.metaphor_ru += ' В немецком естественно meine beiden Eltern и ihre beiden Vorschläge; для alle сохраняется alle unsere Dateien.';
  }
  if(p.id==='GFC012') {
   p.pattern='You can use the room provided that you leave it tidy.';
   p.group_title='Permission with an explicit limiting condition';
   p.title_en=p.group_title;
   p.logic={function:'grammar-mechanics',core:'Permission conditional on an explicit requirement',form:'Provided that + finite condition',metaphor_ru:'Provided that вводит обязательное условие разрешения: можно, при условии что. В придаточном о будущем используем настоящее время, не will.'};
   p.langs=[
    {lang:'en',formula:'Permission clause + provided that + present-tense condition',example:p.pattern,translation:'Ты можешь пользоваться комнатой при условии, что оставишь её в порядке.',examples:[{text:'We can postpone the meeting provided that everyone agrees.',translation_ru:'Мы можем перенести встречу при условии, что все согласны.'},{text:'She can borrow the camera provided that she returns it by Friday.',translation_ru:'Она может взять камеру при условии, что вернёт её к пятнице.'}]},
    {lang:'de',formula:'Permission clause, vorausgesetzt, dass + subordinate condition',example:'Du kannst den Raum benutzen, vorausgesetzt, dass du ihn ordentlich hinterlässt.',translation:'Ты можешь пользоваться комнатой при условии, что оставишь её в порядке.',examples:[{text:'Wir können die Besprechung verschieben, vorausgesetzt, dass alle zustimmen.',translation_ru:'Мы можем перенести встречу при условии, что все согласны.'},{text:'Sie kann die Kamera ausleihen, vorausgesetzt, dass sie sie bis Freitag zurückgibt.',translation_ru:'Она может взять камеру при условии, что вернёт её к пятнице.'}]}
   ];
  }
 }
 let output=patterns;
 if(!Array.isArray(reference)) output={...Object.fromEntries(Object.entries(reference).filter(([k])=>!['patterns','id','set_id','title','title_ru','title_en'].includes(k))),set_id:family,title:enTitle,title_ru:ruTitle,patterns};
 prepared.push([filename,output]);
 if(groups && !groups.some(g=>g.id===family)) groups.push({id:family,title:enTitle,title_en:enTitle,title_ru:ruTitle,description_ru:ruTitle,description_en:enTitle});
 if(!registry.sets.some(s=>s.id===family)) registry.sets.push({id:family,title:enTitle,title_ru:ruTitle,title_en:enTitle,description:`Compare how English and German express ${enTitle.toLowerCase()}. Practise reusable constructions with Russian translations.`,description_ru:`${ruTitle}: сравнивайте английские и немецкие конструкции по примерам с русским переводом.`,levels:['B2','C1'],tags:['Grammar','B2','C1','EN','DE'],inventory:{communicative_tasks:ruTitle,grammar:ruTitle,lexis:'Everyday life, communication and work; vocabulary supports the grammatical contrast.',connector_pattern:enTitle,outcome:`Practise ${enTitle.toLowerCase()} in English and German with Russian prompts and three contrasting example scenarios.`}});
}
assert.equal(prepared.reduce((n,[,d])=>n+asPatterns(d).length,0),300);
// No existing pattern is removed, renumbered or overwritten by this integration.
for(const [file,doc] of prepared) write(file,doc);
if(groups) write(groupFile,groupDocument);
registry._updated='2026-09-17'; write(registryPath,registry);
console.log(JSON.stringify({families:prepared.length,new_patterns:300,language_examples:1800,parallel_example_pairs:900,group_file:groupFile??'not required/discovered',shard_format:Array.isArray(reference)?'array':'object'},null,2));
