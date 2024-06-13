const searchQuestions = function(query,user_locale,FAQ) {
	user_locale = user_locale !== undefined ? user_locale.locale : "EN"
	const questions = FAQ.find(lang => lang.locale === user_locale).questions
	const filtered = questions.filter(question => {
		if(question.tags) {
			if(question.tags.some(tag => query.toLowerCase().includes(tag))) return true;
		}
		return question.title.toLowerCase().includes(query.toLowerCase()) || question.tags.includes(query.toLowerCase())
	});
	return filtered
}

module.exports = {searchQuestions}