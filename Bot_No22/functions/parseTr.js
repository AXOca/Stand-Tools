const { fetchFAQ } = require("./fetchFAQ")
const { fetchUI } = require("./fetchUserLocales")

async function parseExport(lang) {
  if(!lang) return console.error("parseExport language missing")
  let faq = await fetchFAQ()

  let result = `Language: ${lang}`
  
  //Search for the specified language
  let questions = faq.find(language => language.locale === lang)
    
  questions.questions.forEach(question => {    
    result += parseQuestion(question)
  });

  function parseQuestion(question) {
    let parsedQuestion = ""
    parsedQuestion += (`\n-- Question #${question.index} --\nTitle: ${question.title}\nAnswer: ${question.answer}\nTags:`)
    if(question.tags) {
      question.tags.forEach(tag => {
      parsedQuestion += ` ${tag}`
    });
    if(question.interactions) {
      parsedQuestion += `\nInteractions:`
      question.interactions.forEach(interaction => {
        if(interaction.type === "link") {
          parsedQuestion += `\n  - Link title (${interaction.link}): ${interaction.title}`
        }
      })
    }
    parsedQuestion += `\nIndex: ${question.index} (Unless you know what you're doing, do not change!)`
    }
    return parsedQuestion;
  }

  //Check if there are any newer added questions in the EN (base)locale.

  //Determine the highest question index of the EN locale
  const ENIndex = faq.findIndex(locale => {return locale.locale === "EN"})
	const ENindexlist = faq[ENIndex].questions.map(question => question = question.index)
	const ENHighestIndex = Math.max(...ENindexlist)
  
  //Determine the highest question index of the export locale
  const indexlist = questions.questions.map(question => question = question.index)
  const highestIndex = Math.max(...indexlist)

  const ENHasNewQuestions = highestIndex<ENHighestIndex

  //Add new questions to export, to allow translation
  if(ENHasNewQuestions) {
    faq[0].questions.forEach(question => {
      if(question.index>highestIndex) result += parseQuestion(question);
    })
  }

  result += `\n-- UI --`

  let ui = fetchUI(lang).translations
  Object.keys(ui).forEach(key => {
    result += `\n${key}: ${ui[key].replace(/\n/g, '\\n')}`
  })
  return result 
}

function parseImportFAQ(exportfile) {   
  if(!exportfile) return console.error("parseImportFAQ exportfile missing")    
  let result = {}
  result.locale = exportfile.match(/^Language: (\w+)/)[1] //Fetch the language from the file
  result.questions = []

  //Move questions into array
  let questionsArray = exportfile.split(/-- Question #\d+ --/)
  questionsArray.shift() //Remove first line
  questionsArray = questionsArray.map(q => q = q.trim()) //Remove leading and trailing new lines
  questionsArray = questionsArray.map(q => { 
    return q = q.split("\n")
  })

  questionsArray.forEach(q => {
    let currentQuestion = {}
    let interaction = false
    let CurrentInteraction = null
    q.forEach(ln => {
      if(ln.startsWith("Title: ")) currentQuestion.title = ln.slice("Title: ".length);
      if(ln.startsWith("Answer: ")) currentQuestion.answer = ln.slice("Answer: ".length);
      if(ln.startsWith("Tags: ")) currentQuestion.tags = ln.slice("Tags: ".length).split(" ")
      if(ln.startsWith("Interactions:")) { //Open interactions = []
        interaction = true
        currentQuestion.interactions = []
      }
      if(ln.startsWith("Index: ")) currentQuestion.index = parseInt(ln.slice("Index: ".length).split(" ")[0])
      if(interaction) {
        if(ln.startsWith("  -")) { //Clear CurrentInteraction by pushing it 
          if(CurrentInteraction) currentQuestion.interactions.push(CurrentInteraction)
          CurrentInteraction = {}
          ln = ln.slice("  -".length).trim()
        }
        if(ln.startsWith("Link title")) { //Build Link interaction object
          CurrentInteraction.type = "link";
          CurrentInteraction.link = ln.slice(ln.indexOf("(")+1,ln.indexOf(")")).trim()
          CurrentInteraction.title = ln.slice(ln.lastIndexOf(":")+1).trim()
          currentQuestion.interactions.push(CurrentInteraction);
          CurrentInteraction = null
        }
      }
    })
    result.questions.push(currentQuestion)
  })
  return result
}

function parseImportUI(exportfile) {
  if(!exportfile) return console.error("parseImportUI exportfile missing")
  let result = {}
  result.locale = exportfile.match(/^Language: (\w+)/)[1] //Fetch the language from the file
  result.translations = {}

  let elements = exportfile.slice(exportfile.indexOf("\n-- UI --")+"\n--UI --\n".length).trim()
  elements = elements.split('\n')
  elements.forEach(element => {
    let key = element.slice(0,element.indexOf(":"));
    let object = element.slice(element.indexOf(":")+2).replace(/\\n/g, '\n');
    result.translations[key] = object
  })
  return result
}

//parseExport("NL").then(e => console.log(e))

module.exports = { parseExport,parseImportFAQ,parseImportUI}