# socket-leaderboard

A quick example app that demonstrates realtime updates using Socket.io. Built using Node on the server and Backbone, Marionette, and [Backbone.ioBind](https://github.com/noveogroup/backbone.iobind) on the client.

Client-side dependencies are included in this repository. Download and run `npm install` to get Node dependencies.

To see the app in action, run `node server.js` and open two browser windows. `leaderboard.html` will respond to changes made in `scoring.html`. There is a mock database included in `server.js` to maintain athletes and scores in your Node session's memory.