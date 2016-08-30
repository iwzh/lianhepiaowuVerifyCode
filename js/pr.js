(function($, BT) {
	/**
	 * 获取应用本地配置
	 **/
	 function getSettings() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}
	
		var device = null,
			BluetoothAdapter = null,
			BAdapter = null,
			UUID = null,
			uuid = null,
			main = null,
			bluetoothSocket = null,
			BluetoothDevice = null,
			IntentFilter=null;
			
	//定义 Locker 类
	var Bluetooth = $.Bluetooth = $.Class.extend({
		/**
		 * 构造函数
		 * */
		init: function(options) {
			var self = this;
			//
			options = options || {};
			options.callback = options.callback || options.done ;
			self.options = options;			
			self.device = self.options.device || device;			
			if(self.device==null){			
				main = self.main = plus.android.runtimeMainActivity();
				BluetoothAdapter = self.BluetoothAdapter = self.options.BluetoothAdapter || BluetoothAdapter || plus.android.importClass("android.bluetooth.BluetoothAdapter");
				BAdapter=self.BAdapter = self.options.BAdapter || BAdapter || self.BluetoothAdapter.getDefaultAdapter();	
				//self.device = self.options.device || device || self.BAdapter.getRemoteDevice(self.mac_address);
				//plus.android.importClass(self.device);
			}		
			if(self.oepnBluetooth(self.BAdapter)){
			/*	//搜索蓝牙时候用到
				if(self.IntentFilter==null){
					self.IntentFilter = self.options.BluetoothAdapter || plus.android.importClass('android.content.IntentFilter') || self.IntentFilter;	
				}*/
			}else{
				$.toast('开启蓝牙失败,无法使用蓝牙打印机;请手动设置权限后，重新打开');
			}
		},

		/**
		 * 扫描已配对蓝牙
		 */
		scan: function() {
			var self = this;
			BAdapter=self.options.BAdapter || self.BAdapter || BAdapter;
			var lists = BAdapter.getBondedDevices(); //获取配对的设备列表
				plus.android.importClass(lists);
				var iterator = lists.iterator();
				plus.android.importClass(iterator);
				var bluetoothList=new Array();
				while(iterator.hasNext()) {
					var d = iterator.next();
					plus.android.importClass(d);
					var item=new Object();
					item.id=d.getAddress();
					item.name=d.getName();
					bluetoothList.push(item);
				}
				self.setBlueList(bluetoothList);
			return bluetoothList;
		},
		/**
		 * 获取本地存储的蓝牙列表
		 **/
		getBlueList : function() {
			var stateText = localStorage.getItem('$bluetoothlist') || "{}";
			return JSON.parse(stateText);
		},

		/**
		 * 设置本地存储的蓝牙列表
		 **/
		setBlueList:function(state) {
			state = state || {};
			localStorage.setItem('$bluetoothlist', JSON.stringify(state));
		},
		/*
		 * 清除本地存储的蓝牙列表
		 */
		clearBlueList:function(){
			this.setBlueList({});
		},
		/*
		 * 获取保存的蓝牙连接地址
		 */
		getMacAddress:function(){
			var settings=getSettings();
			settings.bluestate=1;
			if(settings.bluestate){
				var address = localStorage.getItem('$bluetoothMacAddress') || "";
				return address;
			}else{
				console.log('未开启蓝牙打印设置');
				return false;
			}
		},
		/*
		 * 设置保存蓝牙连接的地址
		 */
		setMacAddress:function(address){
			address=address||'';
			localStorage.setItem('$bluetoothMacAddress', address);
		},
		/*
		 * 测试打印
		 */
		testprint:function(mac_address,teststr,device,bluetoothSocket){
			teststr=teststr||"测试打印机\r\n\r\n\r\n\r\n\r\n\r\n这是测试打印的。内容可以忽略";
			this.print(mac_address,teststr,device,bluetoothSocket);
		},
		/*
		 * 连接蓝牙
		 */
		connectedBT:function(bluetoothSocket){
			if(!bluetoothSocket.isConnected()) {
				console.log('检测到设备未连接，尝试连接....');
				bluetoothSocket.connect();
				if(!bluetoothSocket.isConnected()) {
					$.toast('设备未连接，重新连接失败，请确保设备开启。');
				}else{
					console.log('设备已连接。');
				}
			}
			console.log('设备已连接 bluetoothSocket.isConnected()=' + bluetoothSocket.isConnected());
		},
		/**
		 * 打印
		 */
		print: function(mac_address, printstring, device, bluetoothSocket) {
			var self = this;
			if(!mac_address) {
				var mac_address=self.getMacAddress();
				if(!mac_address){				
					$.toast('请选择蓝牙打印机');
					return;	
				}
			}
			if(device == null) {
				main = plus.android.runtimeMainActivity();
				BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter");
				BAdapter = BluetoothAdapter.getDefaultAdapter();
				device = BAdapter.getRemoteDevice(mac_address);
				plus.android.importClass(device);
			}
			
			//蓝牙连接或者uuid为空时，需要重新导入蓝牙socket
			if(bluetoothSocket== null||UUID ==null){					
				UUID = plus.android.importClass("java.util.UUID");
				uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
			}
			
			bluetoothSocket = device.createInsecureRfcommSocketToServiceRecord(uuid);
			plus.android.importClass(bluetoothSocket);

			self.connectedBT(bluetoothSocket);//检测蓝牙是否连接；
			

			if(bluetoothSocket.isConnected()) {
				/*
				bluetoothSocket.start();//开启蓝牙socket连接，不开启无法打印
				bluetoothSocket.accept();//开启蓝牙socket连接，不开启无法打印
				bluetoothSocket.start();//开启蓝牙socket连接，不开启无法打印
				*/
				var outputStream = bluetoothSocket.getOutputStream();
				plus.android.importClass(outputStream); 
				var bytes = plus.android.invoke(printstring, 'getBytes', 'gbk');
				var clearFormat = [0x1b, 0x40]; //复位打印机
				outputStream.write(clearFormat);
				outputStream.write(bytes);
				outputStream.flush();
				/*//device = null //清空连接设备 如果持续验票的情况下，不能每次都初始化设备。只需要关闭蓝牙与手机APP的socket即可。无需情况设备*/
				bluetoothSocket.close(); //必须关闭蓝牙连接否则意外断开的话打印错误
			}else{
				$.toast("蓝牙未连接，无法打印");
			}
		},
		/*
		 * 蓝牙连接成功的提示
		 */
		confirm:function(mac_address){
			var self=this;
			if($.os.plus) {
				mac_address=mac_address||self.options.mac_address||self.getMacAddress();
				var btnArray = ['是', '否'];
				$.confirm('蓝牙已连接成功，是否测试打印？', '测试打印', btnArray, function(e) {
					if(e.index == 0) {
						self.print(mac_address)
					}else{
						console.log('取消打印');
					}
				})
			} else {
				alert("蓝牙已连接成功");
			}
		},
		/*
		 * 开启蓝牙 
		 */
		oepnBluetooth:function(BAdapter){
			var self=this;
			BAdapter=self.options.BAdapter || self.BAdapter|| BAdapter;
			if(!BAdapter.isEnabled()) {
				$.toast('检测到未打开蓝牙,尝试打开中....');
				var status = BAdapter.enable();
				if(status){
					console.log('已为您开启蓝牙,正在搜索设备...');
					$.toast('已成功为您开启蓝牙');
				}else{
					console.log('开启蓝牙失败,请手动开启蓝牙');
					$.toast('开启蓝牙失败,请手动开启蓝牙');
					return false; 
				}
			}
			return true;
		},
		checkIsContacted:function(bluetoothSocket){
			if(!bluetoothSocket){
					$.toast('无法连接设备。');
					return false;
				}
				if(!bluetoothSocket.isConnected()) {
					console.log('检测到设备未连接，尝试连接....');
					bluetoothSocket.connect();
					if(!bluetoothSocket.isConnected()) {
						$.toast('设备未连接，重新连接失败，请确保设备开启。');
						return false;
					} else {
						console.log('设备已连接。');
					}
				}
				return true;
		},
		contactBT:function(mac_address){
			var self=this;
			if(!mac_address) {
					$.toast('请选择蓝牙打印机');
					return;
				}
				if(BAdapter == null) {
					main = plus.android.runtimeMainActivity();
					BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter");
					BAdapter = BluetoothAdapter.getDefaultAdapter();
				}
				device = BAdapter.getRemoteDevice(mac_address);
				plus.android.importClass(device);
				if(BluetoothDevice==null){
					//蓝牙信息	
					BluetoothDevice = plus.android.importClass("android.bluetooth.BluetoothDevice");
				}
				var bdevice = new BluetoothDevice();
				/*for(i in device){
					console.log(i+':'+device[i]);
				}*/
				if(device.getBondState()==bdevice.BOND_NONE){
					//地址一样，执行配对
					if(mac_address == device.getAddress()){
						console.log('正在执行配对');
						if(device.createBond()) {
							console.log("配对成功");							
						}
					}					
				}	
				
				//蓝牙连接或者uuid为空时，需要重新导入蓝牙socket
				if(!uuid||UUID ==null){					
					UUID = plus.android.importClass("java.util.UUID");
					uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
				}
				bluetoothSocket = device.createInsecureRfcommSocketToServiceRecord(uuid);
				plus.android.importClass(bluetoothSocket);
				self.checkIsContacted(bluetoothSocket);
		},
		/*
		 * 搜索蓝牙设备,并创建处理HTML蓝牙列表
		 */
		seachBT:function(address){
			var self=this;
				device=self.device=self.options.device||self.device||device;
				if(device == null) {
					main=self.main = plus.android.runtimeMainActivity();
					BluetoothAdapter=self.BluetoothAdapter = self.options.BluetoothAdapter||self.BluetoothAdapter|| plus.android.importClass("android.bluetooth.BluetoothAdapter");
					BAdapter=self.BAdapter =self.options.BAdapter||self.BAdapter|| BluetoothAdapter.getDefaultAdapter();
				}
				//检查蓝牙是否开启
				self.oepnBluetooth(BAdapter);
				IntentFilter=self.IntentFilter=self.options.IntentFilter|| self.IntentFilter || plus.android.importClass('android.content.IntentFilter');
				BluetoothDevice =self.BluetoothDevice= self.options.BluetoothDevice || self.BluetoothDevice||plus.android.importClass("android.bluetooth.BluetoothDevice");
				var filter = new IntentFilter();
				var bdevice = new BluetoothDevice();
				var on = un = new Array();
				var onstr=unstr=null;
				
				BAdapter.startDiscovery(); //开启搜索
				var receiver;
				receiver = plus.android.implements('io.dcloud.android.content.BroadcastReceiver', {
					onReceive: function(context, intent) { 
						//实现onReceiver回调函数
						plus.android.importClass(intent); 
						//通过intent实例引入intent类，方便以后的‘.’操作
						//获取action
						console.log(intent.getAction()); 

						if(intent.getAction() == "android.bluetooth.adapter.action.DISCOVERY_FINISHED") {
							console.log("搜索结束")
							main.unregisterReceiver(receiver); //取消监听
						
						} else {
							BleDevice = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
							//判断是否配对
							if(BleDevice.getBondState() == bdevice.BOND_NONE) {
								console.log("未配对蓝牙设备：" + BleDevice.getName() + '    ' + BleDevice.getAddress());
					
								//参数如果跟取得的mac地址一样就配对
								if(address == BleDevice.getAddress()) {
									//配对命令.createBond()
									if(BleDevice.createBond()) {
										console.log("配对成功");
										var onitem='{"id":'+BleDevice.getAddress()+',"name":'+BleDevice.getName()+'}';
										on.push(onitem);										
									}else{
										//判断防止重复添加
										if(unstr!=BleDevice.getName()){
											unstr=BleDevice.getName();
											var unitem='{"id":'+BleDevice.getAddress()+',"name":'+BleDevice.getName()+'}';
											un.push(unitem);
										}
										$.toast('配对失败！请手动前往蓝牙界面。取消配对后，重试！');
										return;
									}
								} else {
									//判断防止重复添加
									if(BleDevice.getName()!=unstr){
										var unitem='{"id":'+BleDevice.getAddress()+',"name":'+BleDevice.getName()+'}';
										un.push(unitem);
										unstr=BleDevice.getName();
									}
								}
							} else {
								//判断防止重复添加
								if(onstr!=BleDevice.getName()){
									console.log("已配对蓝牙设备：" + BleDevice.getName() + '    ' + BleDevice.getAddress());																
									var onitem='{"id":'+BleDevice.getAddress()+',"name":'+BleDevice.getName()+'}';
									on.push(onitem);	
									onstr=BleDevice.getName();
								}			
							}
						}
						
						var ooo=self.arrayUnique(on);
						var uuu=self.arrayUnique(un);
						console.log('ooo'+on);
						console.log('uuu'+un);
						var ttt=new Object();						
						ttt.on=on;
						ttt.un=un;
						return ttt;
					}
				});

				filter.addAction(bdevice.ACTION_FOUND);//搜索设备  
				filter.addAction(BAdapter.ACTION_DISCOVERY_STARTED);
				filter.addAction(BAdapter.ACTION_DISCOVERY_FINISHED);
				filter.addAction(BAdapter.ACTION_STATE_CHANGED);
				
				filter.addAction(BAdapter.ACTION_STATE_CHANGED); //监听蓝牙开关

				main.registerReceiver(receiver, filter); //注册监听
		},	
		arrayUnique:function(quearr){	
			quearr.sort();
			var re=[quearr[0]];
			for(var i = 1; i < quearr.length; i++)
			{
				if( quearr[i] !== re[re.length-1])
				{
					re.push(quearr[i]);
				}
			}
			return re;
		}
	});

	
	//添加 Bluetooth 插件
	$.fn.bluetooth = function(options) {
		var self = this[0];		
		var bluetooth = null;
		bluetooth = new Bluetooth(options);
		return bluetooth;
	}
	
})(mui, window);