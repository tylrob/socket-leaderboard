var socket = io();



//Models
var PostModel = Backbone.Model.extend({
	defaults: {
		"athlete": 'Athlete',
		"score": 100
	}
});

var Posts = Backbone.Collection.extend({
	url: 'posts',
	model: PostModel,
	socket: window.socket,
	comparator: 'score',
	initialize: function(){
		_.bindAll(this, 'serverCreate');
		this.ioBind('create', this.serverCreate, this);
		console.log("finished initialize");
	},
	serverCreate: function(data){
		console.log("The server wants to create")
		console.log("got " + data);
	}
});

var MyLayout = Marionette.View.extend({
	el: '#layout-hook',
	template: "#layout",
	regions: {
		mainRegion: "#main-region",
	}
});


//These three views create a Table in Marionette 3
var RowView = Marionette.View.extend({
	tagName: 'tr',
	template: '#row-template',
	triggers: {
		'click .edit-weighin': 'editWeighin',
		'click .delete-weighin': 'deleteWeighin'
	},

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
		'deleteWeighin': 'deleteWeighin'
	},
	editWeighin: function(){
		console.log("Edit link clicked");
	},
	deleteWeighin: function(event){
		event.model.destroy({wait:true});
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


var posts = new Posts();


posts.fetch({
	success: function(){
		console.log("fetch successful");
	},
	error: function(){
		console.log("fetch error");
	}
});

var myLayout = new MyLayout().render();
var tableView = new TableView({collection: posts});
myLayout.showChildView('mainRegion', tableView);