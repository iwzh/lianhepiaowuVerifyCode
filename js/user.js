;mui.web_query = function(func_url, params, onSuccess, onError, retry) {
	var onSuccess = arguments[2] ? arguments[2] : function() {};
	var onError = arguments[3] ? arguments[3] : function() {};
	var retry = arguments[4] ? arguments[4] : 3;
	var test=1;
	func_url = 'http://www.lianhepiaowu.net/appapi/v1/index.php?version=1.0.0&fn=' + func_url;
	if(test){
		func_url = 'http://test.lianhepiaowu.com/appapi/v1/index.php?version=1.0.0&fn=' + func_url;
	}
	/*
	 * 
		for(i in params) {
			st += i + ':' + params[i]+'; ';
		}
		console.log('params:' + st);
		console.log(func_url);
	*/
		
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
(function($, owner) {

	owner.login = function(loginInfo, onSuccess, onError) {
			var settings = owner.getSettings();
			if(owner.auto_login()) {
				var state = owner.getState();
				var username = owner.username();
				var token = state.token,
					tokenlianhe = owner.password();
				var param = {
					'username': username,
					'token': token,
					'tokenlianhe': tokenlianhe,
					'device': settings.device
				};
				$.web_query('autoLogin', param, onSuccess, onError);
			} else {
				loginInfo = loginInfo || {};
				loginInfo.username = loginInfo.username || '';
				loginInfo.password = loginInfo.password || '';
				if(loginInfo.username.length < 3) {
					return onError('USERNAME_SHORT');
				}
				if(loginInfo.password.length < 4) {
					return onError('PASSWORD_SHORT');
				}
				var param = {
					'username': loginInfo.username,
					'tokenlianhe': loginInfo.password,
					'device': settings.device
				};
				$.web_query('autoLogin', param, onSuccess, onError);
			}
		}
		//清除登录信息
	owner.clear = function() {
		owner.setState({});
		owner.password('');
//		plus.storage.removeItem('password');
	}
	//登录用户名
	owner.username = function(username) {
			if(username) {
				plus.storage.setItem('username', username);
			} else if(username === '') {
				plus.storage.removeItem('username');
				return;
			}
			return plus.storage.getItem('username');
		}
		//登录密码
	owner.password = function(password) {
		if(password) {
			plus.storage.setItem('password', password);	
		} else if(password === '') {
			plus.storage.removeItem('password');
			return;
		}
		return plus.storage.getItem('password');
		
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
	
	//检查是否包含自动登录的信息
	owner.auto_login = function(username) {
		username = username || owner.username();
		var state = owner.getState();
		var token = state.token,
			password = owner.password();
		if(!username || (!token && !password)) {
			console.log('auto_logininfo:false;username:'+username+',token:'+token+',password:'+password);
			return false;
		}
		return true;
	}
	owner.loginSucc = function(data) {
		if(arguments.length == 0) {
			return 'owner.loginSucc';
		} else {
			var datainfo = data.data;
			var state = owner.getState();
			state.token = datainfo.token;
			var tokentime = (datainfo.expire_time * 1000) + new Date().getTime();
			state.tokentime = tokentime;
			return true;
		}
	}
	owner.loginErr = function(errorcode) {
		if(arguments.length == 0) {
			return 'owner.loginErr';
		} else {
			console.log(errorcode);
			switch(errorcode) {
				case 'FAILED_NETWORK':
					$.toast('网络出错，请重试');
					break;
				default:
					owner.clear();
					$.toast(errorcode);
			}
			return false;
		}
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
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
	};
	
	/**
	 * 获取当前user
	 **/
	owner.getUser = function() {
		var stateText = localStorage.getItem('$user') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前user
	 **/
	owner.setUser = function(user) {
		user = user || {};
		localStorage.setItem('$user', JSON.stringify(user));
	};
}(mui, window.app = {}));