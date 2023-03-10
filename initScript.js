// this file not needed for now


// REQUIRES THE HTML TO BE CONSTRUCTED
window.tesol = function (getQuestionsFunctionArg) {
		
	let unique = ((a = 0) => () => a++)()
	const $ = new Proxy({}, { get: (_, c) => document.querySelector(`.${c}`) })
	const status = $.status
	const el = str =>{
		const strs = str.split('.')
		let el = document.createElement(strs.shift())
		for (let cls of strs) el.classList.add(cls)
		return el
	}

	el('div.wrapper.hidden')
	let main = $.main

	let current = -1
	let questions = []


	async function getQuestions() {
		status.classList.add("fetching")
		status.innerText = "suallar alınır"
		let questionsText = await getQuestionsFunctionArg()
		status.classList.add("fetchingDone")

		let questionsRaw = questionsText.split(/(?=#)/)
		let questions = questionsRaw.map(questionRaw => {
			let question = { asking: "~va9iff", answers: [], correctId: 0 }
			let components = questionRaw.split(/(?=(?:\n#)|(?:\n\+)|(?:\n-))/)
			// console.log(components)
			for (let [i, component] of components.entries()) {
				component = component.trim()/*.replace("\r\n", "<br>")*/
				component = component + ''
				if (component[0] == "#") {
					question.asking = component.substr(1).trim()
				} else if (component[0] == "-") {
					question.answers.push(component.substr(1).trim())
				} else if (component[0] == "+") {
					question.answers.push(component.substr(1).trim())
					question.correct = question.answers.length - 1
				}
			}
			return question
		})
		return questions
	}


	function goTo(num, direction = null /*true for next, flase for prev*/) {
		console.log(num)
		// console.log(num, current)
		direction ??= num > current
		console.log(num)
		num = +num
		let question = questions[num]
		question.num = num
		let q = createQuestion(question)

		q.classList.add(direction ? "fromRight" : "fromLeft")

		lastQuestion.after(q)
			setTimeout(() => lastQuestion.classList.remove(direction ? "fromRight" : "fromLeft"), 40)
			lastQuestion.classList.add(direction ? "fadeLeft" : "fadeRight")
		lastQuestion.removeAfter(300)
		lastQuestion = q
		current = num
		norm()
	}

	// setTimeout(()=>goTo(9),500)

	function createQuestion(question) {
		let q = el("div.question")
		q.setAttribute("s", unique())
		console.log(question)
		question.num ??= current
		q.innerHTML = `
			<div class="asking">
				<i>${+question.num+1}.</i> ${question.asking}
			</div>
			<div class="answers"></div>
		`
		// q.querySelector('i').onclick = e=> {
		// 	e.target.after(createGoToDial(question.num))
		// }
		question.answerElements = []
		for (const [i, answer] of question.answers.entries()) {
			let answerElement = el(`div.answer`)
			question.answerElements.push(answerElement)
			if (question.selected == i) {
				answerElement.classList.add('selected')
				if (question.correct == i )
					answerElement.classList.add('correct')
			}
			answerElement.innerText = answer
			answerElement.onclick = e => {
				question.answerElements.forEach(ans=>ans.classList.remove('selected'))
				if (question.correct == i) answerElement.classList.add('correct')
				if (question.selected == i ) {
					answerElement.classList.remove('selected')
					delete question.selected
				} else {
					answerElement.classList.add('selected')
					question.selected = i

				}
			}
			q.querySelector(".answers").appendChild(answerElement)
			// console.log(question)
		}
		// console.log(q)
		q.removeAfter = t =>
			setTimeout(() => {
				// console.log(q)
				q.remove()
			}, t)
		return q
	}

	let lastQuestion = createQuestion({
		asking: `Suallarınızı rahatlıqla işləyə biləcəyiniz, və gözlərinizin hüzur tapacağı bir proje.`,
		answers: [
			`Sağa və ya sola çəkərək növbəti və ya əvvəlki suala keçid edin`,
			`Tam ekranda hüzurlu bir şəkildə istifadə edin`,
			`Cavablarınızın doğruluğunu yoxlayın`,
			`İstənilən nömrəli suala çevirin`,
			`Cavabları aşağı çəkib daha əl çatan edin`,
			`Uğurlar!`,
		],
		correct: 2,
	})

	lastQuestion.classList.add('initial')

	$.question.replaceWith(lastQuestion)

	function next() {
		if (current >= questions.length - 1) {
			goTo(questions.length - 1)
			return
		} else
			current ++
		goTo(current, true)
	}

	function prev() {
		if (current <=  0) {
			goTo(0)
		} else
			current--
		goTo(current, false)
	}

	;(async () => {
		questions = await getQuestions()
		gotoNum.max = +questions.length	
		$.next.onclick = e => next()
		$.prev.onclick = e => prev()
	})()


	let closeIcon = $.close
	let norms = [$.fullScreen, $.eye, $.pull, $.goto]
	let hides = [$.gotoNum, closeIcon]
	function norm() {
		norms.forEach(a=>a.classList.remove('hidden'))
		hides.forEach(hide=>{
			hide.classList.add('hidden')
			hide.visible = false
		})
	}
	closeIcon.onclick = norm
	function spec(...specs) {
		[...norms, ...hides].forEach(a=>a.classList.add('hidden'))
		;[...specs, closeIcon].forEach(spec=>{
			spec.classList.remove('hidden')
			spec.visible = true
		})
	}


	$.eye.onclick = e=>{
		e.target.classList.toggle('highlight')
		main.classList.toggle('eyeOpen')
	}

	$.pull.onclick = e=>{
		main.classList.toggle('pulled')
		// e.target.classList.toggle('pulled')
	}

	$.fullScreen.onclick = e => document.body.requestFullscreen()

	const gotoNum = $.gotoNum
	$.goto.onclick = e=> {
		if (!gotoNum.visible) {
			spec($.goto, $.gotoNum)

			return null
		}
		goTo(+gotoNum.value-1)
		gotoNum.classList.add('hidden')
		norm()
	}
	gotoNum.onchange = e => {
		if (gotoNum.value > questions.length) gotoNum.value = questions.length
		if (gotoNum.value < 1 ) gotoNum.value = 1
		console.log(gotoNum)
		$.goto.onclick()
	}



	// swipes
	let touchstartX = 0
	let touchstartY = 0
	let touchendX = 0
	let justSwiped = false
	let justSwipedVertical = false
	function checkDirection() {
		if (Math.abs(touchendX - touchstartX) < 30) return
		if (touchendX < touchstartX) next()
		if (touchendX > touchstartX) prev()
	}

	document.addEventListener('touchstart', e => {
		justSwiped = false	
		touchstartX = e.changedTouches[0].screenX
		touchstartY = e.changedTouches[0].screenY
	})

	document.addEventListener('touchmove', e => {
		// if (justSwipedVertical) return
		let y = e.changedTouches[0].screenY
		let diff = touchstartY - y 
		// $.main.innerText = diff
		if (diff < -50) {
			main.classList.add('pulled')
			// justSwipedVertical = false
		}
		if (diff > 50) {
			main.classList.remove('pulled')
			// justSwipedVertical = false
		}
		// alert('sl')
		// if (touchstartY - y < -50) $.pull.click()
	}) 
	// 	if (justSwiped) return
	// 	let x = e.changedTouches[0].screenX
	// 	let diff = x - touchstartX
	// 	// $.main.innerHTML = diff
	// 	if (diff > 44) {
	// 		prev()
	// 		justSwiped = true
	// 	}
	// 	if (diff < -44) {
	// 		next()
	// 		justSwiped = true
	// 	}
		// will also work if you want to scroll answers so, disable it

	document.addEventListener('touchend', e => {
		// justSwipedVertical = false
		if (justSwiped) return

		touchendX = e.changedTouches[0].screenX
		checkDirection()
		// justSwiped = false

	})


	// norm()
	status.classList.add("hideStatus")
	setTimeout(()=>status.remove(),300)
}
