(function($, owner) {
	//清除以配对蓝牙设备
	owner.clearblue = function() {
		owner.setBlueList({});
	}
	
	//检查是否已登录
	owner.has_login = function() {
		var state = owner.getState();
		var username = owner.username();
		var token = state.token;
		var tokentime = state.tokentime;
		var timestarp = new Date().getTime();		
		if(!username || !token || !tokentime || (tokentime < timestarp)) {
			console.log('has_login:false;username:'+username+',token:'+token+',tokentime:'+tokentime);
			return false;
		}
		return true;
	}
	
	
	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}

	/**
	 * 获取蓝牙列表
	 **/
	owner.getBlueList = function() {
		var stateText = localStorage.getItem('$bluetooth') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置蓝牙列表
	 **/
	owner.setBlueList = function(state) {
		state = state || {};
		localStorage.setItem('$bluetooth', JSON.stringify(state));
	};
	
}(mui, window.app = {}));