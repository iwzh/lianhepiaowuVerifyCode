;
mui.web_query = function(func_url, params, onSuccess, onError, retry) {
	var onSuccess = arguments[2] ? arguments[2] : function() {};
	var onError = arguments[3] ? arguments[3] : function() {};
	var retry = arguments[4] ? arguments[4] : 3;
	func_url = 'http://test.lianhepiaowu.com/appapi/v1/index.php?version=1.0.0&fn=' + func_url;
	mui.ajax(func_url, {
		data: params,
		dataType: 'json',
		type: 'post',
		timeout: 3000,
		success: function(data) {
			if(data.status) {
				onSuccess(data);
			} else {
				onError(data.msg);
			}
		},
		error: function(xhr, type, errorThrown) {
			retry--;
			if(retry > 0) return mui.web_query(func_url, params, onSuccess, onError, retry);
			onError('FAILED_NETWORK');
		}
	})
};

;

function UserInfo() {};

UserInfo.login=function(loginInfo,onSuccess,onError){
	var setting=UserInfo.getSettings();
//	if(UserInfo.auto_login()){
//		var param={'username':loginInfo.username,'token':UserInfo.token,'device':setting.device}
//		mui.web_query('autoLogin',param,onSuccess,onError);
//	}else{
		var param={'username':loginInfo.username,'password':loginInfo.password,'device':setting.device}
		mui.web_query('getToken',param,onSuccess,onError);
//	};
}
//清除登录信息
UserInfo.clear = function() {
	plus.storage.removeItem('username');
	plus.storage.removeItem('token');
	plus.storage.removeItem('tokentime');
}


/**
	 * 获取应用本地配置
	 **/
	UserInfo.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	UserInfo.getSettings = function() {
			var settingsText = localStorage.getItem('$settings') || "{}";
			return JSON.parse(settingsText);
		}
	
	/**
	 * 获取当前状态
	 **/
	UserInfo.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	UserInfo.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
	};

//检查是否已登录
UserInfo.has_login = function() {
	var username = UserInfo.username();
	var token = UserInfo.token();
	if(!username || !token) {
		return false;
	}
	return true;
};
//检查是否包含自动登录的信息
UserInfo.auto_login = function() {
	var username = UserInfo.username;
	var token = UserInfo.token;
	var tokentime=UserInfo.tokentime;
	var D=new Date();
	timestarp=D.getTime();
	//用户名，token不存在或者token过期超过1000秒，此时需要重新登陆
	if(!username || !token||(tokentime+1000000<timestarp)) {
		return false;
	}
	return true;
}
//用户名
UserInfo.username = function() {
	if(arguments.length == 0) {
		return plus.storage.getItem('username');
	}
	if(arguments[0] === '') {
		plus.storage.removeItem('username');
		return;
	}
	plus.storage.setItem('username', arguments[0]);
};

//token
UserInfo.token = function() {
	if(arguments.length == 0) {
		return plus.storage.getItem('token');
	}
	if(arguments[0] === '') {
		plus.storage.removeItem('token');
		return;
	}
	plus.storage.setItem('token', arguments[0]);
};
//token
UserInfo.tokentime = function() {
	if(arguments.length == 0) {
		return plus.storage.getItem('tokentime');
	}
	if(arguments[0] === '') {
		plus.storage.removeItem('tokentime');
		return;
	}
	plus.storage.setItem('tokentime', arguments[0]);
};
//设备信息
UserInfo.device = function() {
	if(arguments.length == 0) {
		return plus.storage.getItem('device');
	}
	if(arguments[0] === '') {
		plus.storage.removeItem('device');
		return;
	}
	plus.storage.setItem('device', arguments[0]);
}