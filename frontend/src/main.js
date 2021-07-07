import 'core-js/stable'
const runtime = require('@wailsapp/runtime')

function formatSeconds(seconds) {
	var days = Math.floor(seconds / 86400)
	seconds -= days * 86400
	var hours = Math.floor(seconds / 3600)
	seconds -= hours * 3600
	var minutes = Math.floor(seconds / 60)
	seconds -= minutes * 60
	return (days != 0 ? days + " Days " : "") + (hours != 0 ? hours + " Hours " : "") + (minutes != 0 ? (minutes < 10 ? "0" + minutes + " Minutes " : minutes + " Minutes ") : "")
}

function start() {
	var ticketsStore = runtime.Store.New('Tickets')
	var app = document.getElementById('app')
	
	var user = {}
	
	app.style.width = '100%'
	app.style.height = '100%'

	app.innerHTML = `
		<div class="login">
			<div class="form">
				<form class="login-form">
					<input type="text" name="url" placeholder="Jira URL"/>
					<input type="email" name="email" placeholder="Jira Email"/>
					<input type="password" name="key" placeholder="API Key"/>
					<button>login</button>
				</form> 
			</div> 
		</div>
		<div class="main" hidden=true> 
			<div class="set-time">
				<div class="set" data-value=0>Today</div>
				<div class="set" data-value=1>This Week</div>
				<div class="set" data-value=2>Last Week</div>
				<div class="set" data-value=3>This Month</div>
				<div class="set" data-value=4>Last Month</div>
				<div class="set" data-value=5>This Quarter</div>
				<div class="set" data-value=6>Last Quarter</div>
			</div>
			<div class="header">
				<div class="total-time">
					Total Time: <span>0</span>
				</div>
				<hr>
			</div>
			<div class="tickets">
			</div>
		</div>`
	
	var loginEle = document.querySelector('.login')
	var loginFormEle = document.querySelector('.login-form')
	var emailEle = document.querySelector('input[name="email"]')
	var keyEle = document.querySelector('input[name="key"]')
	var urlEle = document.querySelector('input[name="url"]')
	
	var mainEle = document.querySelector('.main')
	var selectTimeEle = document.querySelectorAll('.main > .set-time > .set')
	var totalTimeEle = document.querySelector('.main > .header > .total-time > span')
	var ticketsEle = document.querySelector('.main > .tickets')

	backend.Login.GetUserInfo().then(function(u) {
		user = JSON.parse(u)

		if (user && user.email != "") {
			backend.Tickets.CreateClient(u).catch(function(err) {
				console.log(err)
			})
			mainEle.removeAttribute('hidden')
			loginEle.setAttribute('hidden', true)
		}
	})

	ticketsStore.subscribe(function(state) {
		var totalWorkTime = 0

		ticketsEle.innerHTML = ""

		if (state.length > 0) {

			state.forEach(function(ticket) {
				totalWorkTime += ticket.work_time
				totalTimeEle.textContent = formatSeconds(totalWorkTime)

				ticketsEle.innerHTML += ' \
					<div id="' + ticket.id + '" class="ticket"> \
						<div class="id"><span href="' + ticket.link + '" target="_blank">ID: ' + ticket.id + '</span></div> \
						' + (ticket.parent.id != "" ? '<div class="parent"><span href="' + ticket.parent.link + ' target="_blank"> Parent: ' + ticket.parent.id + '</span></div>' : '') + ' \
						<div class="name">Ticket Title: ' + ticket.name + '</div> \
						<div class="time">Ticket Work Time: ' + formatSeconds(ticket.work_time) + '</div> \
					</div>\
					<hr>'
			})
		} else {
			ticketsEle.innerHTML += "<hr><div>You don't have any logged hours!</div>"
		}
	})

	loginFormEle.addEventListener('submit', function(e) {
		e.preventDefault()
		if (urlEle.value == "" || emailEle == "" || keyEle == "") {
			errEle.innerHTML = "All fields must be filled and valid"
		} else {
			var j = '{"email": "' + emailEle.value + '", "url": "' + urlEle.value + '", "key": "' + keyEle.value + '"}'
			backend.Login.Save(j).then(function() {
				mainEle.removeAttribute('hidden')
				loginEle.setAttribute('hidden', true)
			}).catch(function(err) {
				console.log(err)
			})
			backend.Tickets.CreateClient(j).catch(function(err) {
				console.log(err)
			})
		}
	})

	selectTimeEle.forEach(function(e) {
		e.addEventListener('click', function(e) {
			backend.Tickets.GetTickets(parseInt(e.target.dataset.value)).then(function(err){
				if (err) {
					console.log(err)
				}
			})
		})
	})
}

runtime.Init(start)