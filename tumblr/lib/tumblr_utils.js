Array.prototype.uniques = function() {
    var o = {}, i, l = this.length, r = [];
    for(i=0; i<l;i+=1) o[this[i]] = this[i];
    for(i in o) r.push(o[i]);
    return r;
};

/* 
/ NEED TO KEEP THIS UP TO DATE!
/   Known Issues:
/    - MSN not supported 
*/
exports._providers = [{
		"domain": "adultswim.com",
		"regex": ["tools\\\/swf\\\/sitevplayer.swf"]
	},
	{
		"domain": "abc.go.com",
		"regex": ["VP2\\.swf"]
	},
	{
		"domain": "allthingsd.com",
		"regex": ["http:\\\/\\\/s\\.wsj\\.net\\\/media\\\/swf\\\/main\\.swf"]
	},
	{
		"domain": "bbc.co.uk, news.bbc.co.uk",
		"regex": ["http:\\\/\\\/[a-zA-Z0-9]+\\.bbc\\.co\\.uk\\\/player\\\/emp\\\/[0-9_]+\\\/widgets\\\/[a-zA-Z0-9]+\\.swf\\?revision="]
	},
	{
		"domain": "blip.tv",
		"regex": ["flash\\\/stratos\\.swf", "http:\\\/\\\/blip\\.tv\\\/play\\\/"]
	},
	{
		"domain": "break.com",
		"regex": ["sLink=(.*)&EmbedSEOLinkKeywords"]
	},
	{
		"domain": "brightcove.com",
		"regex": ["brightcove.com\\\/services\\\/viewer"]
	},
	{
		"domain": "cbs.com",
		"regex": ["rcpHolder"]
	},
	{
		"domain": "cbsnews.com",
		"regex": ["http:\\\/\\\/www\\.cbsnews\\.com\\\/video\\\/watch\\\/\\?id=([0-9]+n)&releaseURL", "([0-9]+)n&autoplay=true", "rcpHolder"]
	},
	{
		"domain": "collegehumor.com",
		"regex": ["videoid([0-9]+)", "clip_id=([0-9]+)"]
	},
	{
		"domain": "comedycentral.com, mtvnservices.com, media.mtvnservices.com",
		"regex": ["http:\\\/\\\/media\\.mtvnservices\\.com\\\/(mgid:cms:.*?:.*?\\.com:[0-9]+)"]
	},
	{
		"domain": "cwtv.com",
		"regex": ["mn_player_QMP"]
	},
	{
		"domain": "dailymotion.com",
		"regex": ["videoId%22%3A%22([a-zA-Z0-9]+)", "dailymotion.com%2Fvideo%2F([a-zA-Z0-9]+)_", "dailymotion\\.com\\\/embed\\\/video\\/([a-zA-Z0-9]+)", "dailymotion\\.com\\\/swf\\\/([a-zA-Z0-9]+)", "www.dailymotion.com\\\/video\\\/([a-zA-Z0-9]+)_"]
	},
	{
		"domain": "espn.com, espn.go.com",
		"regex": ["ESPN_Player\\.swf\\?id=[0-9]+"]
	},
	{
		"domain": "exercisetv.tv",
		"regex": ["playerwidget"]
	},
	{
		"domain": "fora.tv",
		"regex": ["FORA_Player_[0-9]+\\.ver[0-9_]+\\.swf"]
	},
	{
		"domain": "fubiz.net",
		"regex": ["mediaplayer\\.swf"]
	},
	{
		"domain": "funimation.com, player.hulu.com",
		"regex": ["videoTitle=.*?", "FUNimationVideo", "http:\\\/\\\/player\\.hulu\\.com\\\/express\\\/.*?"]
	},
	{
		"domain": "funnyordie.com, funnyordie.co.uk",
		"regex": ["key=([a-zA-Z0-9]+)"]
	},
	{
		"domain": "gamespot.com",
		"regex": ["Swiff_[0-9]+"]
	},
	{
		"domain": "gametrailers.com",
		"regex": ["mid=([0-9]+)", "%26id=([0-9]+)"]
	},
	{
		"domain": "gawker.com",
		"regex": ["http:\\\/\\\/cache\\.gawkerassets\\.com\\\/assets\\\/util\\\/videoModule"]
	},
	{
		"domain": "giantbomb.com",

		"regex": ["class=\"player-wrapper\"", "videoUrl: \"(.*?)\"", "http:\\\/\\\/media\\.giantbomb\\.com\\\/media\\\/video\\\/flash\\\/"]
	},
	{
		"domain": "video.google.com",
		"regex": ["docid=([\\-0-9]+)"]
	},
	{
		"domain": "howcast.com",
		"regex": ["www.howcast.com\\\/videos\\\/([0-9]+)"]
	},
	{
		"domain": "hulu.com",
		"regex": ["\\\/site-player\\\/playerwrapper\\.swf"]
	},
	{
		"domain": "ign.com",
		"regex": ["\"href\":\"(.*?)\""]
	},
	{
		"domain": "indieclick.com, indieclicktv.com",
		"regex": ["(http:\\\/\\\/.*?\\.indieclicktv\\.com\\\/player\\\/swf\\\/[a-zA-Z0-9]+\\\/[a-zA-Z0-9]+\\\/[0-9]+\\\/[0-9]+\\\/defaultPlayer)-player\\.swf"]
	},
	{
		"domain": "justin.tv",
		"regex": ["channel=[a-zA-Z0-9_]+"]
	},
	{
		"domain": "liveleak.com",
		"regex": ["http:\\\/\\\/www\\.liveleak\\.com\\\/e\\\/([a-zA-Z0-9]+_[a-zA-Z0-9]+)", "token%3D(.*?)%26"]
	},
	{
		"domain": "livestream.com",
		"regex": ["allowChat=.*?&channel=(.*?)&id"]
	},
	{
		"domain": "megavideo.com",
		"regex": ["http:\\\/\\\/wwwstatic\\.megavideo\\.com\\\/mv_player\\.swf"]
	},
	{
		"domain": "metacafe.com",
		"regex": ["metacafe\\.com%2Fwatch%2F(.*?)&", "www.metacafe.com\\\/watch\\\/(.*?)\"", "itemID=([0-9]+)"]
	},
	{
		"domain": "monocle.com",
		"regex": ["\\\/Resources\\\/flash\\\/mvpLite\\.swf"]
	},
	{
		"domain": "motionbox.com",
		"regex": ["videos%2F([a-zA-Z0-9]+)%2Fplayer_manifest", "video_uid=([a-zA-Z0-9]+)"]
	},
	{
		"domain": "mtv.com",
		"regex": [":mtv.com:[0-9]+"]
	},
	{
		"domain": "vids.myspace.com",
		"regex": ["&amp;el=(.*)&amp;on", "&el=(.*)&on"]
	},
	{
		"domain": "nbc.com",
		"regex": ["rewindpl3_0"]
	},
	{
		"domain": "video.pbs.org",
		"regex": ["width=512&height=288&video=.*?\\\/([0-9]+)"]
	},
	{
		"domain": "revision3.com",
		"regex": ["player-v([0-9]+)"]
	},
	{
		"domain": "spike.com",
		"regex": ["video_player_[0-9]+", "PRODUCT_OBJECT"]
	},
	{
		"domain": "techcrunch.tv",
		"regex": ["embedCode=(\\w*\\-\\w*)"]
	},
	{
		"domain": "ted.com",
		"regex": ["&amp;su=(http:\\\/\\\/www\\.ted\\.com.*?\\.html)&amp;", "&su=(http:\\\/\\\/www\\.ted\\.com.*?\\.html)&", "vu=http:\\\/\\\/video\\.ted\\.com\\\/.*?&su"]
	},
	{
		"domain": "theonion.com",
		"regex": ["videoid=([0-9]+)"]
	},
	{
		"domain": "travelchannel.com",
		"regex": ["videoPlayerWidget"]
	},
	{
		"domain": "twit.tv, live.twit.tv",
		"regex": ["TWiT.*?"]
	},
	{
		"domain": "vbs.tv",
		"regex": ["permalink=(.*?)&", "&pl=(.*?)\""]
	},
	{
		"domain": "vevo.com",
		"regex": ["thePlayer"]
	},
	{
		"domain": "viddler.com",
		"regex": ["&key=([a-zA-Z0-9]+)", "viddler.com\\\/player\\\/([a-zA-Z0-9]+)", "viddler\\.com\\\/simple\\\/([a-zA-Z0-9]+)\\\/"]
	},
	{
		"domain": "vimeo.com",
		"scrape_url": "http:\\\/\\\/(?:\\w+\\.)*vimeo\\.com\\\/([0-9]+)|http:\\\/\\\/(?:\\w+\\.)*vimeo\\.com.*clip_id=([0-9]+)",
		"regex": ["vimeo\\.com\\\/moogaloop\\.swf\\?clip_id=([0-9]+)", "clip_id=([0-9]+)&server=vimeo\\.com", "clip_id=([0-9]+)", "(player.vimeo.com\\/video\\/)(\\d*)"]
	},
	{
		"domain": "youtube.com",
		"scrape_url": "http:\\\/\\\/(?:\\w+\\.)*youtube\\.com.*v=([\\_\\-a-zA-Z0-9]+)",
		"regex": ["&video_id=([\\_\\-a-zA-Z0-9]+)", "youtube\\.com\/v\/([\\_\\-a-zA-Z0-9]+)", "youtube\\-nocookie\\.com\/v\/([\\_\\-a-zA-Z0-9]+)", "youtube\\.com\/embed\/([\\_\\-a-zA-Z0-9]+)"]
}];


exports.findUrl = function(url){
	for (var j = 0; j < this._providers.length; j++){
		for (var k = 0; k < this._providers[j].regex.length; k++){
			var reg = new RegExp(this._providers[j].regex[k]);
			var domain_split = this._providers[j].domain.split(',');
			var valid_domain = false;
			for (var l = 0; l < domain_split.length; l++) {
				var domain_reg = new RegExp(domain_split[l].trim());
				if (domain_reg.test(url)) {
					valid_domain = true;
					break;
				}
			}
			if (reg.test(url) && valid_domain) {
				var match = reg.exec(url);
				if (match[0] === undefined) { match[0] = "unknown 0"; }
				if (match[1] === undefined) { match[1] = match[0]; }
				if (match[2] === undefined) { match[2] = match[1]; }
				return { url: this.composeKnownUrl(this._providers[j].domain, match[2]) };
			}
		}
	}
	return { url: null };
};


exports.composeKnownUrl = function(domain, video_id){
	var known_url = "";
	switch (domain){
	case 'youtube.com':
		known_url = "http://www.youtube.com/watch?v=" + video_id;
		break;
	case 'dailymotion.com':
		known_url = "http://www.dailymotion.com/video/" + video_id;
		break;
	case 'vimeo.com':
		known_url = "http://vimeo.com/" + video_id;
		break;
	case 'techcrunch.tv':
		known_url = "http://techcrunch.tv/watch?id=" + video_id;
		break;
	case 'collegehumor.com':
		known_url = "http://collegehumor.com/video/" + video_id;
		break;
	default:
		known_url = null;
	}
	return known_url;
};
