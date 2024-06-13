const { fetchFAQ } = require("../functions/fetchFAQ");
const { fetchUI } = require("../functions/fetchUserLocales")

const faqresponse = {locale:"EN",questions:[{title:"How do I get my account back?",answer:"You don't",tags:["account","lost","id","commontest"]},{title:"What is 1+1?",answer:"2",tags:["maths","2","sum","commontest"],interactions:[{type:"link",link:"https://en.wikipedia.org/wiki/1%2B1",title:"Reference"}]}]}
const uiresponse = {locale:"ES",translations:{faq:"Vraag Asked Questions",introembed_title:"Frequently Asked Questions",introembed_description:"**Welcome to our FAQ system!**\n\nFind the answers to your burning questions.",introembed_lang_button:"Language",introembed_search_button:"Search",introembed_addfaq_button:"Add Question",introembed_remfaq_button:"Remove Question",langselector:"Select your language",langcurrent:"current",langupdateembed_title:"Succesfully changed your language to",searchfaqform_querylabel:"What's your question?",searchfaqform_templatequery:"How do I get my account ID back?",nomatchesembed_title:"No matches found.",nomatchesembed_description:"Please specify your search.",bestmatch:"Best match:",relevantquestions_selector:"Other questions matching:",addfaqform_title:"FAQ | Add Question (English)",addfaqform_qtitle_label:"Question Title",addfaqform_qtitle_placeholder:"How do I get my account ID back?",addfaqform_qanswer_label:"Question answer",addfaqform_qanswer_placeholder:"You don't",addfaqform_tags_label:"Search tags (comma separated)",addfaqform_tags_placeholder:"account, id, lost, forgot",delfaq:"Which question would you like to remove?",delfaq_selector:"Select question",delfaq_confirmation_title:"Are you sure you want to delete this question?",delfaq_confirmation_description:"Question",delfaq_confirmation_confirmbutton:"Delete",delfaq_confirmation_cancelbutton:"Cancel",delfaq_cancel_title:"Cancelled question deletion",delfaq_cancel_description:"No longer deleting",delfaq_completed_title:"Succesfully deleted question",delfaq_completed_description:"Deleted"}}

async function updateFAQ() {
    let faq = await fetchFAQ()
    let localeFound = false
    faq.forEach(lang => { //If it is an existing language, update the corresponding FAQ questions.
        if (lang.locale === faqresponse.locale) {
            localeFound = true
          lang.questions = faqresponse.questions;
        }
    });
    if(!localeFound) { //If it is a new language, push it to the FAQ array.
        faq.push(faqresponse);
    }
}

async function updateUI() {
    let ui = await fetchUI()
    let localeFound = false
    ui.forEach(lang => { //If it is an existing language, update the corresponding UI translations
        if(lang.locale === uiresponse.locale) {
            localeFound = true
            lang.translations = uiresponse.translations
        }
    })
    if(!localeFound) { //If it is a new language, push it to the UI array.
        ui.push(uiresponse)
    }
}

//updateFAQ()
updateUI()