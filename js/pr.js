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
			var agintry=0;
			var defaultpage="tab-webview-subpage-bluetooth.html";
			
	//定义 Bluetooth 类
	var Bluetooth = $.Bluetooth = $.Class.extend({
		/**
		 * 构造函数
		 * */
		init: function(options) {
			var self = this;
			options = options || {};
			self.options = options;			
			self.device = self.options.device || device;
			if(self.device==null){			
				main = self.options.main = self.options.main || plus.android.runtimeMainActivity();
				BluetoothAdapter = self.options.BluetoothAdapter = self.options.BluetoothAdapter || BluetoothAdapter || plus.android.importClass("android.bluetooth.BluetoothAdapter");
				BAdapter=self.options.BAdapter = self.options.BAdapter || BAdapter || BluetoothAdapter.getDefaultAdapter();	
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
		/**
		 * 获取本地存储的搜索蓝牙列表
		 **/
		setBTSearchList:function(state) {
			var stateText = localStorage.getItem('$btseachlist') || '{"on":"[]","un":"[]"}';
			return JSON.parse(stateText);
		},
		/**
		 * 设置本地存储的搜索蓝牙列表
		 **/
		setBTSearchList:function(state) {
			state = state || '{"on":"[]","un":"[]"}';
			localStorage.setItem('$btseachlist', JSON.stringify(state));
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
			teststr=teststr||"这是测试打印的。内容可以忽略 ";
			this.print(mac_address,teststr,device,bluetoothSocket);
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
			self.initParam({"mac_address":mac_address},1);
			bluetoothSocket=self.options.bluetoothSocket;
			self.connectedBT(bluetoothSocket,mac_address);//检测蓝牙是否连接；
			if(bluetoothSocket.isConnected()) {
				var outputStream = bluetoothSocket.getOutputStream();
				plus.android.importClass(outputStream); 
				var bytes = plus.android.invoke(printstring, 'getBytes', 'gbk');
				var clearFormat = [0x1b, 0x40]; //复位打印机
				outputStream.write(clearFormat);
				/*start *** 文字加粗*/
				/*
				outputStream.write([0x1b,0x45,1]);
				var title=plus.android.invoke("【联合票务】", 'getBytes', 'gbk');				
				outputStream.write(title);
				outputStream.write([0x1b,0x45,0]);
				*/
				/*end *** 文字加粗*/
				outputStream.write(bytes);
				outputStream.write([0x1b,0x64,4]);//多走纸n行
				/*outputStream.write([0x1b,0x2a,1,6,0,10,0,122,222,22,54]);//位图模式*/
				outputStream.flush();
				/*//device = null //清空连接设备 如果持续验票的情况下，不能每次都初始化设备。只需要关闭蓝牙与手机APP的socket即可。无需情况设备*/
				/*bluetoothSocket.close(); //必须关闭蓝牙连接否则意外断开的话打印错误*/
			}else{
				$.toast("蓝牙未连接，无法打印");
			}
		},
		/*
		 * 成功的提示
		 */
		confirm:function(mac_address){
			var self=this;
			var confirm_title='测试打印';
			var confirm_tips='蓝牙已连接成功，是否测试打印？';
			if($.os.plus) {
				mac_address=mac_address||self.options.mac_address||self.getMacAddress();
				var btnArray = ['是', '否'];
				$.confirm(confirm_tips, confirm_title, btnArray, function(e) {
					if(e.index == 0) {
						self.print(mac_address)
					}else{
						console.log('取消');
					}
				});
			} else {
				alert("成功");
			}
		},
		/*
		 * 开启蓝牙 
		 */
		oepnBluetooth:function(BAdapter){
			var self=this;
			BAdapter=self.options.BAdapter || BAdapter;
			if(!BAdapter.isEnabled()) {
				console.log('检测到未打开蓝牙,尝试打开中....');				
				$.toast('检测到未打开蓝牙,尝试打开中....');
				var status = BAdapter.enable();
				if(status){
					console.log('已为您开启蓝牙...');
					$.toast('已成功为您开启蓝牙');
				}else{
					console.log('开启蓝牙失败,请手动开启蓝牙');
					$.toast('开启蓝牙失败,请手动开启蓝牙');
					return false; 
				}
			}
			return true;
		},
		initParam:function(options,checkSocket,checkDevice){
			var self = this;
			checkSocket=checkSocket||0;
			checkDevice=checkDevice||0;
			device = self.options.device = options.device||self.options.device ||device ;			
			if(self.device==null){
				main = self.options.main = options.main||self.options.main||main||plus.android.runtimeMainActivity();
				BluetoothAdapter =self.options.BluetoothAdapter =options.BluetoothAdapter||self.options.BluetoothAdapter ||BluetoothAdapter||plus.android.importClass("android.bluetooth.BluetoothAdapter");
				BAdapter=self.options.BAdapter=options.BAdapter||self.options.BAdapter || BAdapter || BluetoothAdapter.getDefaultAdapter();
			}
			if(options.mac_address){
				device =self.options.device= BAdapter.getRemoteDevice(options.mac_address);
				plus.android.importClass(device);
			}
			if(checkDevice){
				//蓝牙信息	
				BluetoothDevice=self.options.BluetoothDevice =options.BluetoothDevice||self.options.BluetoothDevice||plus.android.importClass("android.bluetooth.BluetoothDevice");
			}
			//蓝牙连接或者uuid为空时，需要重新导入蓝牙socket
			if(checkSocket){
				/*检查Socket时,要么导入Socket要么给Socket初始值*/
				UUID=self.options.UUID =options.UUID||self.options.UUID||plus.android.importClass("java.util.UUID");
				uuid=self.options.uuid =options.uuid||self.options.uuid||UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
				bluetoothSocket=self.options.bluetoothSocket = options.bluetoothSocket||device.createInsecureRfcommSocketToServiceRecord(uuid);
				plus.android.importClass(bluetoothSocket);
			}
			return self;
		},
		/*
		 * 连接蓝牙
		 */		
		connectedBT: function(bluetoothSocket,mac_address) {
			var self = this;
			if(!bluetoothSocket.isConnected()) {
				if(agintry>1){
					console.log('重试两次了，不再尝试');
					$.toast("重试多次未成功连接蓝牙打印机，请关闭后重试！");
					bluetoothSocket=self.options.bluetoothSocket=null;
					UUID=self.options.UUID=null;
					uuid=self.options.uuid=null;
					return false;
				}
				try {
					bluetoothSocket.connect();
				} catch(e) {
					console.log('Bluetooth Connect Error!'+e);
					bluetoothSocket.close();
					self.initParam({"mac_address":mac_address},1,1);
					bluetoothSocket =self.options.bluetoothSocket;
					console.log('设备连接出错了，重新连接');
					agintry++;
					bluetoothSocket.connect();					
				}
				
				if(!bluetoothSocket.isConnected()) {
					$.toast('设备未连接，重新连接失败，请确保设备开启。');
					return false;
				} else {
					console.log('设备已连接。');
				}
				console.log('设备已连接 bluetoothSocket.isConnected()=' + bluetoothSocket.isConnected());
			}
			agintry=0;
			return true;
		},
		contactBT:function(mac_address){
			var self=this;
			if(!mac_address) {
					$.toast('请选择蓝牙打印机');
					return;
				}
				self.initParam({"mac_address":mac_address},1,1);
				var bdevice = new BluetoothDevice();			
				if(device.getBondState()==bdevice.BOND_NONE){
					//地址一样，执行配对
					if(mac_address == device.getAddress()){
						console.log('正在执行配对');
						if(device.createBond()) {
							console.log("配对成功");	
							//第一次配对成功将配对成功的数据放入已配对蓝牙列表
							var _bluelist=self.getBlueList();
							var item=new Object();
								item.id=mac_address;
								item.name=mac_name;
								_bluelist.push(item);
								self.setBlueList(_bluelist);
						}
					}					
				}				
				self.connectedBT(self.options.bluetoothSocket,mac_address);
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
		/*
		 * 取消蓝牙配对
		 */
		removeBlueDevices:function(mac_address,mac_name){
			var self=this;
			if(!mac_address) {
				$.toast('请选择成功配对的蓝牙设备');
				return;
			}
			self.initParam({"mac_address":mac_address},1,1);
			device=self.options.device;
			BluetoothDevice=self.options.BluetoothDevice;
			var bdevice = new BluetoothDevice();			
			if(device.getBondState()==bdevice.BOND_BONDED){
				//地址一样，执行删除配对
				if(mac_address == device.getAddress()){
					var btnArray = ['是', '否'];
					$.confirm('是否删除已配对的设备：' + mac_name + '？', '删除设备', btnArray, function(e) {
						if(e.index == 0) {
							if(device.removeBond()) {
								/*set_badge_status(mac_address, 2);*/
								var _bluelist=self.getBlueList();
								var item=new Object();
								item.id=mac_address;
								item.name=mac_name;
								var rebluelist=_bluelist.map(function(listiteam){
									if(JSON.stringify(item)!=JSON.stringify(listiteam)){
										return listiteam;
									}
								});
								self.setBlueList(rebluelist);
								console.log("删除配对蓝牙设备：\n" + mac_name + " 成功");
								return true;
							}
						} else {							
							console.log('取消删除设备操作');
							return false;
						}
					});
				}					
			}else{
				console.log("未配对设备，不能删除");
				return false;
			}
		},
		/*
		 * 搜索蓝牙设备,并创建处理HTML蓝牙列表
		 */
		seachBT:function(address){
			var self=this;
			if(address){				
				self.initParam({"mac_address":address},0,1);
			}else{
				self.initParam({},0,1);	
			}
			//检查蓝牙是否开启
			self.oepnBluetooth(BAdapter);
			IntentFilter=self.options.IntentFilter=self.options.IntentFilter||IntentFilter || plus.android.importClass('android.content.IntentFilter');
			BluetoothDevice=self.options.BluetoothDevice=self.options.BluetoothDevice||BluetoothDevice || plus.android.importClass("android.bluetooth.BluetoothDevice");
			var filter = new IntentFilter();
			var bdevice = new BluetoothDevice();
			var on = new Array(),un = new Array(),onstr=null,unstr=null;	
			var BTSeatchList=new Object();
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
						console.log("搜索结束,本地保存未配对设备和已配对设备");
						BTSeatchList.on=on;
						BTSeatchList.un=un;
						main.unregisterReceiver(receiver); //取消监听
						//事件数据
						var eventData = {
							sender: self,
							btsearchlist: BTSeatchList
						};
						//触发声明的DOM的自定义事件(暂定 done 为事件名，可以考虑更有针对的事件名 )
						var firepage = plus.webview.getWebviewById(defaultpage);
						$.fire(firepage,'done', eventData);
					} else {
						BleDevice = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
						//判断是否配对
						if(BleDevice.getBondState() == bdevice.BOND_NONE) {				
							//判断防止重复添加
							if(BleDevice.getName()!=unstr){														
								unstr=BleDevice.getName();
								console.log("未配对蓝牙设备：" + unstr + '    ' + BleDevice.getAddress());		
								var unitem={"id":BleDevice.getAddress(),"name":unstr};
								un.push(unitem);
							}
						} else {
							//判断防止重复添加
							if(onstr!=BleDevice.getName()){
								onstr=BleDevice.getName();
								console.log("已配对蓝牙设备：" + onstr + '    ' + BleDevice.getAddress());
								var onitem={"id":BleDevice.getAddress(),"name":onstr};
								on.push(onitem);	
							}			
						}
					}
				}
			});
			filter.addAction(bdevice.ACTION_FOUND);//搜索设备  
			filter.addAction(BAdapter.ACTION_DISCOVERY_STARTED);
			filter.addAction(BAdapter.ACTION_DISCOVERY_FINISHED);
			filter.addAction(BAdapter.ACTION_STATE_CHANGED);
			
			filter.addAction(BAdapter.ACTION_STATE_CHANGED); //监听蓝牙开关
			main.registerReceiver(receiver, filter); //注册监听
		},	
		/*
		 * 数组去重
		 */
		arrayUnique:function(a) {
			var seen = {};
			return a.filter(function(item) {
				item=JSON.stringify(item);
				return seen.hasOwnProperty(item) ? false : (seen[item] = true);
			});
		}

		/*arrayUnique:function(quearr){
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
		}*/
	});

	
	//添加 Bluetooth 插件
	$.fn.bluetooth = function(options) {
		var self = this[0];		
		var bluetooth = null;
		bluetooth = new Bluetooth(options);
		return bluetooth;
	}
	
})(mui, window);