(function() {

	var ViewApp = Class.create({
		initialize: function() {
			this.fetchAllImages();
		},

		fetchAllImages: function() {
			localforage.getItem('myStorage').then(function(value) {
				var html = "";
				if(value == null) 
					html += '<li class="list-group-item">No items</li>';
				else {
					value.sort(function(x, y){
						return y.timestamp - x.timestamp;
					});
					for(var i = 0; i < value.length; i++) {
						html += '<li class="list-group-item"><a class="text-secondary" href="' + value[i].url + '" download="true"><i class="fas fa-download"></i></a>&nbsp;&nbsp;' + value[i].fileName + '<span class="float-right"> <i class="far fa-clock"></i> ' + new Date(value[i].timestamp*1000).toUTCString() + '</span></li>';
					}
				}
				$$('#view-app-list').html(html);
			}).catch(function(err) {
			    console.log(err);
			});			
		}
	});

	var viewApp = new ViewApp;

})();