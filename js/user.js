;mui.web_query = function(func_url, params, onSuccess, onError, retry) {
	var onSuccess = arguments[2] ? arguments[2] : function() {};
	var onError = arguments[3] ? arguments[3] : function() {};
	var retry = arguments[4] ? arguments[4] : 0;
	var test=0;
	func_url = 'http://www.lianhepiaowu.net/appapi/v1/index.php?version=1.0.0&fn=' + func_url;
	if(test){
		func_url = 'http://test.lianhepiaowu.com/appapi/v1/index.php?version=1.0.0&fn=' + func_url;
	}
	console.log('可重试 '+retry+' 次');
	mui.ajax(func_url, {
		data: params,
		dataType: 'json',
		type: 'post',
		timeout: 4000,
		success: function(data) {
			if(data.status) {
				onSuccess(data);
			} else {
				onError(data.msg);
			}
		},
		error: function(xhr, type, errorThrown) {
			params.retry_num=params.retry_num||0;//存在就加一，不存在就设为0。
			console.log('重试剩 '+retry+' 次');
			if(retry > 0){				
				retry--;
				params.retry_num++;
				return mui.web_query(func_url, params, onSuccess, onError, retry);
			}
			onError('网络信号不好，请点击查询验票结果，剩'+retry);
		}
	})
};
(function($, owner) {

	owner.login = function (loginInfo, onSuccess, onError) {
		var settings = owner.getSettings();
		var param = {'device': settings.device};
		if (owner.auto_login()) {
			var state = owner.getState();
			var user = owner.getUser();
			var token = state.token;
			param.username = user.name;
			param.token = token;
			param.tokenlianhe = user.password;
			$.web_query('autoLogin', param, onSuccess, onError);
		} else {
			loginInfo = loginInfo || {};
			loginInfo.username = loginInfo.username || '';
			loginInfo.password = loginInfo.password || '';
			if (loginInfo.username.length < 3) {
				return onError('USERNAME_SHORT');
			}
			if (loginInfo.password.length < 4) {
				return onError('PASSWORD_SHORT');
			}
			param.username = loginInfo.username;
			param.tokenlianhe = loginInfo.password;
			$.web_query('autoLogin', param, onSuccess, onError);
		}
	};
		//清除登录信息
	owner.clear = function() {
		owner.setState({});
		var user=owner.getUser({});
		user.password=null;
		owner.setUser(user);
//		plus.storage.removeItem('password');
	};

	//检查是否已登录
	owner.has_login = function() {
		var state = owner.getState();
		var user = owner.getUser();
		var username=user.name;
		var token = state.token;
		var tokentime = state.tokentime;
		var timestarp = new Date().getTime();		
		if(!username || !token || !tokentime || (tokentime < timestarp)) {
			console.log('has_login:false;username:'+username+',token:'+token+',tokentime:'+tokentime);
			return false;
		}
		return true;
	};
	
	//检查是否包含自动登录的信息
	owner.auto_login = function(username) {
		var password=null;
		if(!username){
			var user = owner.getUser();
			username=user.name;
			password=user.password;
		}
		var state = owner.getState();
		var token = state.token;
		if(!username || (!token && !password)) {
//			console.log('auto_logininfo:false;username:'+username+',token:'+token+',password:'+password);
			return false;
		}
		return true;
	};
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
	};
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
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	};

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	};

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
	/**
	 * 获取salt
	 **/
	owner.getSalt = function() {
		return 'wzh';
	};
}(mui, window.app = {}));