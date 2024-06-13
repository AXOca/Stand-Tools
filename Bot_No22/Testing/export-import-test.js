let ui = [
  {
    locale: "EN",
    translations: {
      faq: "Frequently Asked Questions",
      introembed_title: "Frequently Asked Questions",
      introembed_description: "**Welcome to our FAQ system!**\n\nFind the answers to your burning questions.",
      introembed_lang_button: "Language",
      introembed_search_button: "Search",
      introembed_addfaq_button: "Add Question",
      introembed_remfaq_button: "Remove Question",
      langselector: "Select your language",
      langcurrent: "current",
      langupdateembed_title: "Succesfully changed your language to",
      searchfaqform_querylabel: "What's your question?",
      searchfaqform_templatequery: "How do I get my account ID back?",
      nomatchesembed_title: "No matches found.",
      nomatchesembed_description: "Please specify your search.",
      bestmatch: "Best match:",
      relevantquestions_selector: "Other questions matching:",
      addfaqform_title: "FAQ | Add Question (English)",
      addfaqform_qtitle_label: "Question Title",
      addfaqform_qtitle_placeholder: "How do I get my account ID back?",
      addfaqform_qanswer_label: "Question answer",
      addfaqform_qanswer_placeholder: "You don't",
      addfaqform_tags_label: "Search tags (comma separated)",
      addfaqform_tags_placeholder: "account, id, lost, forgot",
      delfaq: "Which question would you like to remove?",
      delfaq_selector: "Select question",
      delfaq_confirmation_title: "Are you sure you want to delete this question?",
      delfaq_confirmation_description: "Question",
      delfaq_confirmation_confirmbutton: "Delete",
      delfaq_confirmation_cancelbutton: "Cancel",
      delfaq_cancel_title: "Cancelled question deletion",
      delfaq_cancel_description: "No longer deleting",
      delfaq_completed_title: "Succesfully deleted question",
      delfaq_completed_description: "Deleted"
    }
  },
  {
    locale: "NL",
    translations: {
      faq: "Veelgestelde vragen",
      introembed_title: "Veelgestelde vragen",
      introembed_description: "**Welkom bij ons FAQ systeem!**\n\nVind de antwoorden op al je brandende vragen.",
      introembed_lang_button: "Taal",
      introembed_search_button: "Zoeken",
      introembed_addfaq_button: "Vraag toevoegen",
      introembed_remfaq_button: "Vraag verwijderen",
      langselector: "Selecteer je voorkeurstaal",
      langcurrent: "huidig",
      langupdateembed_title: "Je taal is succesvol veranderd naar",
      searchfaqform_querylabel: "Wat is je vraag?",
      searchfaqform_templatequery: "Hoe krijg ik mijn account ID terug?",
      nomatchesembed_title: "Geen overeenkomsten gevonden.",
      nomatchesembed_description: "Verfijn je zoekopdracht om meer antwoorden te vinden.",
      bestmatch: "Beste overeenkomst:",
      relevantquestions_selector: "Andere vragen die overeenkomen met:",
      addfaqform_title: "FAQ | Add Question (English)",
      addfaqform_qtitle_label: "Question Title",
      addfaqform_qtitle_placeholder: "How do I get my account ID back?",
      addfaqform_qanswer_label: "Question answer",
      addfaqform_qanswer_placeholder: "You don't",
      addfaqform_tags_label: "Search tags (comma separated)",
      addfaqform_tags_placeholder: "account, id, lost, forgot",
      delfaq: "Welke vraag wil je verwijderen?",
      delfaq_selector: "Selecteer vraag",
      delfaq_confirmation_title: "Weet je zeker dat je deze vraag wilt verwijderen?",
      delfaq_confirmation_description: "Vraag",
      delfaq_confirmation_confirmbutton: "Verwijderen",
      delfaq_confirmation_cancelbutton: "Annuleren",
      delfaq_cancel_title: "Vraagverwijdering geannuleerd",
      delfaq_cancel_description: "De volgende vraag wordt niet meer verwijderd",
      delfaq_completed_title: "Vraagverwijdering voltooid",
      delfaq_completed_description: "Verwijderd"
    }
  }
]
  
  let faq = [
    {
      locale: "EN",
      questions: [
        {
          title: "How do I get my account back?",
          answer: "You don't",
          tags: [
            "account",
            "lost",
            "id",
            "commontest"
          ]
        },
        {
          title: "What is 1+1?",
          answer: "2",
          tags: [
            "maths",
            "2",
            "sum",
            "commontest"
          ],
          interactions: [
            {
              type: "link",
              title: "Reference",
              link: "https://en.wikipedia.org/wiki/1%2B1"
            },
            {
              type: "link",
              title: "More info",
              link: "https://google.com/"
            },
            {
              type: "link",
              title: "More info",
              link: "https://google.com/"
            }
          ]
        }
      ]
    },
    {
      locale: "NL",
      questions: [
        {
          title: "Hoe krijg ik mijn account terug?",
          answer: "Niet",
          tags: [
            "account",
            "verloren",
            "id",
            "commontest"
          ]
        },
        {
          title: "Wat is 1+1?",
          answer: "2",
          tags: [
            "wiskunde",
            "2",
            "optellen",
            "commontest"
          ],
          interactions: [
            {
              type: "link",
              title: "Verwijzing",
              link: "https://en.wikipedia.org/wiki/1%2B1"
            }
          ]
        }
      ]
    }
  ]

  let TR = ui

function fetchUI(language) { //Fetch ui-locales.json (of a certain lang)
	if(language) {
		return TR.find(lang => lang.locale == language)
	} else {
		return TR;
	}
}
  
function parseExport(lang) {
  let result = `Language: ${lang}`
  
  //Search for the specified language
  let questions = faq.find(language => language.locale === lang) //!Update to lang option
    
  questions.questions.forEach(question => {    
      result += (`\n-- Question --\nTitle: ${question.title}\nAnswer: ${question.answer}\nTags:`)
      if(question.tags) {
        question.tags.forEach(tag => {
        result += ` ${tag}`
      });
      if(question.interactions) {
        result += `\nInteractions:`
        question.interactions.forEach(interaction => {
          if(interaction.type === "link") {
          result += `\n  - Link title (${interaction.link}): ${interaction.title}`
          }
        })
      }
    }
  });

  result += `\n-- UI --`

  let ui = fetchUI(lang).translations
  Object.keys(ui).forEach(key => {
    result += `\n${key}: ${ui[key].replace(/\n/g, '\\n')}`
  })
  return result
}

function parseImportFAQ(exportfile) {       
  let result = {}
  result.locale = exportfile.match(/^Language: (\w+)/)[1] //Fetch the language from the file
  result.questions = []

  //Move questions into array
  let questionsArray = exportfile.split("-- Question --")
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
  console.log(result)
}

function parseImportUI() {
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
  result
}

//Execution
let exportfile = parseExport("EN")

//parseImportFAQ(exportfile);
parseImportUI(exportfile);
