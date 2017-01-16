var socket = io();

//Marionette App
var App = Marionette.Application.extend({
	initialize: function(){
		//Assign a layout to the App, which in turn assigns the Regions upon its creation.
		this.myLayout = new MyLayout().render();
	}
});

//Models
var Score = Backbone.Model.extend({
	//needs a urlRoot because in this pattern the model is created outside the collection and then added after server ack
	urlRoot: 'scores',
	defaults: {
		"athlete": 'Athlete',
		"score": 100
	},
	initialize: function(){
		_.bindAll(this, 'serverDelete');
		this.ioBind('delete', this.serverDelete, this);
	},
	serverDelete: function(score){
		console.log("heard serverDelete event");
		app.scores.remove(score);
		app.scores.trigger('sync');
	},
	deleteScore: function(){
		this.destroy({silent:true});
	}
});

var Scores = Backbone.Collection.extend({

	//Don't use collection.create(), instead create a new model and .save() it
	//and wait for the server to reply with scores:create to trigger serverCreate.

	url: 'scores',
	model: Score,
	socket: window.socket,
	comparator: 'score',
	initialize: function(){
		_.bindAll(this, 'serverCreate');
		this.ioBind('create', this.serverCreate, this);
		console.log("finished initialize");
	},
	serverCreate: function(score){
		console.log("The server wants to create");
		console.log("got " + score.athlete);
		this.add(score);
	}
});

//Views
var MyLayout = Marionette.View.extend({
	el: '#layout-hook',
	template: "#layout",
	regions: {
		scoringRegion: '#scoring-region',
		mainRegion: "#main-region"
	}
});

var ScoringView = Marionette.View.extend({
	template: '#scoring-template',
	events: {
		'click #submit-button': 'addScore'
	},
	addScore: function(){
		var score = new Score({
			'athlete': 'Tyler',
			'score': 112
		});
		score.save();
	}
});

//These three views create a Table in Marionette 3
var RowView = Marionette.View.extend({
	tagName: 'tr',
	template: '#row-template',
	triggers: {
		'click .edit-weighin': 'editWeighin',
		'click .delete-score': 'deleteScore'
	}
});

var TableBody = Marionette.CollectionView.extend({
	tagName: 'tbody',
	initialize: function(){
		this.listenTo(this.collection, 'sync', function(){
			console.log("tablebody Heard a sync");
			this.render();
		});
	},
	childView: RowView,
	childViewEvents: {
		'editWeighin': 'editWeighin',
		'deleteScore': 'deleteScore'
	},
	editWeighin: function(){
		console.log("Edit link clicked");
	},
	deleteScore: function(event){
		event.model.deleteScore();
	}	
});

var TableView = Marionette.View.extend({
	tagName: 'table',
	className: 'table table-hover',
	template: '#table-template',
	regions: {
		body: {
			el: 'tbody',
			replaceElement: true
		}
	},
	onRender: function(){
		this.showChildView('body', new TableBody({
			collection: this.collection
		}));
	}
});

//Start the Marionette app
var app = new App();

//Default client route
app.scores = new Scores();
app.scores.fetch({
	success: function(){
		console.log("fetch successful");
	},
	error: function(){
		console.log("fetch error");
	}
});
app.myLayout = new MyLayout();
app.scoringView = new ScoringView();
app.tableView = new TableView({collection: app.scores});
app.myLayout.showChildView('scoringRegion', app.scoringView);
app.myLayout.showChildView('mainRegion', app.tableView);

