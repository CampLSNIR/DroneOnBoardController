
import axios from 'axios'
import { accounts } from './accounts'
import { mission } from './mission'
import { plannedmissions } from './plannedmissions'
import { configuration } from './configuration'
import { home } from './home'
import { notif } from './notifications'
import { droneactivity } from './droneactivity'
import './dashboard.css'
import './transition.css'

const dashboard = {
  template: `
  <div>
	<template>
		<div class="hidden">
			<vs-sidebar
				hover-expand
				reduce
				v-model="active"
				open
				class="sidebar"
				>
				<template #logo>
					<span class="material-icons">admin_panel_settings</span>
				</template>
				<div v-on:click="changeActive('home')">
					<vs-sidebar-item id="home">
						<template #icon>
							<span class="material-icons">home</span>
						</template>
						Home
					</vs-sidebar-item>
				</div>
				<vs-sidebar-group v-show="perms['post:mission'] || perms['read:mission']">
					<template #header>
						<vs-sidebar-item arrow>
							<template #icon>
								<span class="material-icons">view_agenda</span>
							</template>
							Missions
						</vs-sidebar-item>
					</template>
					<div v-show="perms['post:mission']" v-on:click="changeActive('mission')" >
						<vs-sidebar-item>
							<template #icon>
								<span class="material-icons">create</span>
							</template>
							Crée une mission
						</vs-sidebar-item>
					</div>
					<div v-show="perms['read:mission']" v-on:click="changeActive('plannedmissions')" >
						<vs-sidebar-item>
							<template #icon>
								<span class="material-icons">list</span>
							</template>
							Voir la liste des missions
						</vs-sidebar-item>
					</div>
				</vs-sidebar-group>
				<vs-sidebar-group>
					<template #header>
						<vs-sidebar-item arrow>
							<template #icon>
								<span class="material-icons">flight_takeoff</span>
							</template>
							Drones
						</vs-sidebar-item>
					</template>
					<vs-sidebar-item>
						<template #icon>
							<span class="material-icons">flight</span>
						</template>
						Drone n°1
					</vs-sidebar-item>
				</vs-sidebar-group>
				<div v-show="perms['read:config']" v-on:click="changeActive('configuration')" >
					<vs-sidebar-item>
						<template #icon>
							<span class="material-icons">settings</span>
						</template>
						Configuration
					</vs-sidebar-item>
				</div>
				<div v-show="perms['edit:user']" v-on:click="changeActive('users')">
					<vs-sidebar-item >
						<template #icon>
							<span class="material-icons">manage_accounts</span>
						</template>
						Comptes
					</vs-sidebar-item>
				</div>
				<template #footer>
					<vs-row justify="space-between">
						<vs-avatar @click="SetDropdownPos" id="avatar">
							<span class="material-icons">person</span>
						</vs-avatar>
						<vs-avatar badge-color="danger" badge-position="top-right" v-on:click="changeActive('notifications')" v-show="DisplayNotifs()">
							<span class="material-icons">
							notifications_none
							</span>
							<template #badge>
								{{ notif_count }}
							</template>
						</vs-avatar>
					</vs-row>
				</template>
			</vs-sidebar>
		</div>
	</template>
	<div class="vs-select__options vs-component--primary" id="user-drop" v-click-outside="outside" v-scroll="outside">
		<div class="vs-select__options__content">
			<button class="vs-select__option" @click="disconnect">
			Se déconnecter 
			</button>
		</div>
	</div>
	<transition name="fade">
		<div v-if="active=='home'">
			<home class="sidebarmargin"></home>
		</div>
	</transition>
	<transition name="fade">
		<div v-if="active=='users'">
			<users class="sidebarmargin"></users>
		</div>
	</transition>
	<transition name="fade">
		<div v-if="active=='mission'">
			<mission class="sidebarmargin"></mission>
		</div>
	</transition>
	<transition name="fade">
		<div v-if="active=='plannedmissions'">
			<plannedmissions class="sidebarmargin"></plannedmissions>
		</div>
	</transition>
	<transition name="fade">
		<div v-if="active=='configuration'">
			<configuration class="sidebarmargin"></configuration>
		</div>
	</transition>
	<transition name="fade">
		<div v-if="active=='notifications'">
			<notif class="sidebarmargin"></notif>
		</div>
	</transition>
	<transition name="fade">
		<div v-if="active=='droneactivity'">
			<droneactivity class="sidebarmargin"></droneactivity>
		</div>
	</transition>

</div>`,
	mounted: async function () {

		this.outside()
		this.Checkislogged()
		let rep = await axios.get('/api/user/me/permissions')
		if (rep.data.success != true) {
			console.log(rep.data)
			this.$router.push({
				path: '/'
			}).catch(() => { });
			return
		}

		this.NotifsCount()

		this.perms = rep.data.payload
		let menu = this.$router.currentRoute.query.menu
		console.log(menu)
		if (!menu) {
			this.$router.push({
				path: '/dashboard',
				query: {
					menu: this.active
				}
			}).catch(() => { });
			return
		} else {
			this.active = menu
		}

		
		let self = this
		this.interval = setInterval(function () {
			self.Checkislogged()
			self.NotifsCount()
		}, 10 * 1000);
	},
	beforeDestroy() {
		clearInterval(this.interval)
	 },
	data:() => ({
		active: 'home', perms: {}, interval: null, notif_count: null
	}),
 	components:{
		  "users": accounts, "mission": mission, "plannedmissions": plannedmissions, "configuration": configuration, "home": home, "notif": notif, "droneactivity": droneactivity
	},
	methods:{
		Checkislogged: async function () {
			let rep = await axios.get('/api/user/me')
			if (rep.data.success != true) {
				console.log(rep.data)
				this.$router.push({ path: '/' }).catch(() => { });
				return
			}
		},
		changeActive : function(active : string){
		   console.log( "active = " , this.active )
		   this.active = active
			this.$router.push({ path: '/dashboard', query: { menu: this.active } }).catch(() => { });

		},
		SetDropdownPos: function () {

			setTimeout(() => {
				let avatar = document.querySelector("#avatar")
				let rect = avatar.getBoundingClientRect();

				let el = document.getElementById("user-drop")
				el.style.display = "";
				el.style.left = rect.left + "px"
				el.style.top = (rect.top - (rect.bottom - rect.top) + window.scrollY) + "px"

			}, 1); // TODO SI POSSIBLE A FIX CORRECTEMENT click-outside est call avant click

		},
		outside: function () {
			let el = document.getElementById("user-drop")
			if (el) el.style.display = "none";
		},
		inside: function () {

		},
		DisplayNotifs: function () {
			return (this.notif_count || 0) > 0
		},
		disconnect: async function () {
			console.log("disconnect")
			await axios.get('/api/disconnect')
			this.$router.push({ path: "/" }).catch(() => { });

		},
		NotifsCount: async function () {

			let rep = await axios.get("/api/user/me/notification")

			if (rep.status == 200) {
				if (rep.data.success != true) {
					this.lasterror = rep.data.error.message
					return
				}
			} else {
				this.lasterror = rep.statusText
				return
			}

			let newcount = rep.data.payload.length



			if (this.notif_count) {
				let c = newcount - this.notif_count
				if (c > 0) {
					const noti = this.$vs.notification({
						progress: 'auto',
						color: "dark",
						position: "bottom-center",
						title: 'Vous avez ' + c + " nouvelles notifications",
						text: ``
					})

					if (this.active == "notifications") {
						this.active = "home"
						this.$router.push({ path: '/dashboard', query: { menu: this.active } }).catch(() => { });
						await this.$nextTick()
						this.active = "notifications"
						this.$router.push({ path: '/dashboard', query: { menu: this.active } }).catch(() => { });
					}
				}
			}

			this.notif_count = newcount
			console.log("notif_count", this.notif_count, newcount)

			this.$forceUpdate()

		}
	},
	watch: {
		$route(to: any, from: any) {
			// TODO : PEUT ETRE DES TRUC A CHANGER ICI
			if (to.path == "/dashboard") {
				this.active = to.query.menu || "home"
				this.$router.push({ path: to.path, query: to.query }).catch(() => { });
			}


		}
	},
	directives: {
		'click-outside': {
			bind: function (el, binding, vNode) {
				// Provided expression must evaluate to a function.
				if (typeof binding.value !== 'function') {
					const compName = vNode.context.name
					let warn = `[Vue-click-outside:] provided expression '${binding.expression}' is not a function, but has to be`
					if (compName) { warn += `Found in component '${compName}'` }

					console.warn(warn)
				}
				// Define Handler and cache it on the element
				const bubble = binding.modifiers.bubble
				const handler = (e) => {
					if (bubble || (!el.contains(e.target) && el !== e.target)) {
						binding.value(e)
					}
				}
				el.__vueClickOutside__ = handler

				// add Event Listeners
				document.addEventListener('click', handler)
			},

			unbind: function (el, binding) {
				// Remove Event Listeners
				document.removeEventListener('click', el.__vueClickOutside__)
				el.__vueClickOutside__ = null

			}
		},
		'scroll': {
			bind: function (el, binding, vNode) {
				// Provided expression must evaluate to a function.
				if (typeof binding.value !== 'function') {
					const compName = vNode.context.name
					let warn = `[Vue-click-outside:] provided expression '${binding.expression}' is not a function, but has to be`
					if (compName) { warn += `Found in component '${compName}'` }

					console.warn(warn)
				}
				// Define Handler and cache it on the element
				const bubble = binding.modifiers.bubble
				const handler = (e) => {
					if (bubble || (!el.contains(e.target) && el !== e.target)) {
						binding.value(e)
					}
				}
				el.__vueClickOutside__ = handler

				// add Event Listeners
				document.addEventListener('scroll', handler)
			},

			unbind: function (el, binding) {
				// Remove Event Listeners
				document.removeEventListener('scroll', el.__vueClickOutside__)
				el.__vueClickOutside__ = null

			}
		}
	  }
}



export { dashboard };