 //控制层 
app.controller('goodsController' ,function($scope,$controller,$location,goodsService,uploadService,itemCatService,typeTemplateService){
	
	$controller('baseController',{$scope:$scope});//继承
	
    //读取列表数据绑定到表单中  
	$scope.findAll=function(){
		goodsService.findAll().success(
			function(response){
				$scope.list=response;
			}			
		);
	}

	//分页
	$scope.findPage=function(page,rows){
		goodsService.findPage(page,rows).success(
			function(response){
				$scope.list=response.rows;
				$scope.paginationConf.totalItems=response.total;//更新总记录数
			}
		);
	}

	//查询实体
	$scope.findOne=function(id){
		goodsService.findOne(id).success(
			function(response){
				$scope.entity= response;
                // SKU列表规格转换
                for(var i=0;i<$scope.entity.itemList.length;i++){
                	$scope.entity.itemList[i].spec=JSON.parse($scope.entity.itemList[i].spec);
                }
			}
		);
	}

	//保存 
	$scope.save=function(){				
		var serviceObject;//服务层对象
        $scope.entity.goodsDesc.introduction=editor.html();// 把富文本的值付给实体
		if($scope.entity.id!=null){//如果有ID
			serviceObject=goodsService.update( $scope.entity ); //修改
		}else{
			serviceObject=goodsService.add( $scope.entity  );//增加
		}				
		serviceObject.success(
			function(response){
				if(response.success){
					alert("保存成功!");
					// 清空entity和编辑器
					$scope.entity={};
					editor.html("");

					//跳转到商品列表页面
					location.href="goods.html";
				}else{
					alert(response.message);
				}
			}		
		);				
	}


	//批量删除 
	$scope.dele=function(){			
		//获取选中的复选框			
		goodsService.dele( $scope.selectIds ).success(
			function(response){
				if(response.success){
					$scope.reloadList();//刷新列表
					$scope.selectIds=[];
				}						
			}		
		);				
	}
	
	$scope.searchEntity={};//定义搜索对象 
	
	//搜索
	$scope.search=function(page,rows){			
		goodsService.search(page,rows,$scope.searchEntity).success(
			function(response){
				$scope.list=response.rows;	
				$scope.paginationConf.totalItems=response.total;//更新总记录数
			}			
		);
	}

	// 上传图片
	$scope.uploadFile=function () {
		uploadService.uploadFile().success(
			function (response) {
				if (response.success){
					// 上传成功,返回图片保存的路径
					$scope.image_entity.url=response.message;//
					// alert($scope.image_entity.url);
				} else{
					alert(response.message);
				}
            }
		).error(function () {
			alert("上传发生错误");
        });

    };

    $scope.entity={ goodsDesc:{itemImages:[],specificationItems:[]}  };

    //将当前上传的图片实体存入图片列表
    $scope.add_image_entity=function(){
    	/*alert($scope.entity.goodsDesc);
        alert($scope.entity.goodsDesc.itemImages);*/
        $scope.entity.goodsDesc.itemImages.push($scope.image_entity)
    };

    //移除图片
    $scope.remove_image_entity=function(index){
        $scope.entity.goodsDesc.itemImages.splice(index,1);
    };

    // 读取一级分类
	$scope.selectItemCat1List=function () {
		itemCatService.findByParentId("0").success(
			function (response) {
				$scope.itemCat1List=response;
            }
		)
    };

	// 读取二级分类
	$scope.$watch('entity.goods.category1Id',function (newValue,oldValue) {
		// 根据选择的值,查询二级分类
		if (newValue != undefined){
            itemCatService.findByParentId(newValue).success(
                function (response) {
                    $scope.itemCat2List=response;
                }
            )
		}

    });

	// 读取三级分类
	$scope.$watch('entity.goods.category2Id',function (newValue,oldValue) {
		// 根据选择的值,查询三级分类
        if (newValue != undefined) {
            itemCatService.findByParentId(newValue).success(
                function (response) {
                    $scope.itemCat3List = response;
                }
            )
        }
    });

	// 对三级分类监控,改变后查询模板Id
    $scope.$watch('entity.goods.category3Id',function (newValue,oldValue) {
        // 根据选择的值,查询三级分类
        if (newValue != undefined) {
            itemCatService.findOne(newValue).success(
                function (response) {
                    $scope.entity.goods.typeTemplateId = response.typeId;// 更新模板Id
                }
            )
        }
    });

	// 模板Id选择后,更新品牌列表,更新模板对象
	$scope.$watch('entity.goods.typeTemplateId',function (newValue,oldValue) {
        if (newValue != undefined) {
            typeTemplateService.findOne(newValue).success(
                function (response) {
                    $scope.typeTemplate = response;// 获取类型模板
                    $scope.typeTemplate.brandIds = JSON.parse($scope.typeTemplate.brandIds);// 品牌列表转换为Json

                    // 先判断ID,如果没有ID, 得到拓展属性,记载模板中的拓展属性
					if ($location.search()['id'] == null){
                        $scope.entity.goodsDesc.customAttributeItems = JSON.parse($scope.typeTemplate.customAttributeItems);
                    }
                }
            );
            // 读取规格列表
            typeTemplateService.findSpecList(newValue).success(
                function(response){
                    $scope.specList=response;
                }
            );
        }
    });

    // 定义一个集合用于装结果,跟上面的重复定义
    // $scope.entity={goodsDesc:{itemImage:[],specificationItems:[]}};

    // 勾选启用规格之后,同步数据到下面
    $scope.updateSpecAttribute = function ($event,name,value) {
		var object = $scope.searchObjectByKey($scope.entity.goodsDesc.specificationItems,'attributeName',name);
    	if (object != null){
    		if ($event.target.checked){
    			object.attributeValue.push(value);
			}else{
    			// 取消勾选
				object.attributeValue.splice(object.attributeValue.indexOf(value),1);// 移除选项

				// 如果选项都取消了,将此条记录移除
				if(object.attributeValue.length == 0){
					$scope.entity.goodsDesc.specificationItems.splice($scope.entity.goodsDesc.specificationItems.indexOf(object),1);
				}

			}
		}else{
    		$scope.entity.goodsDesc.specificationItems.push(
				{"attributeName":name,"attributeValue":[value]}
			);
		}
    }

    // 创建SKU列表
	$scope.createItemList=function () {
		$scope.entity.itemList=[{spec:{},price:0,num:9999,status:'0',isDefault:'0'}];// 初始的一条记录
    	var items=$scope.entity.goodsDesc.specificationItems;
    	for (var i=0;i<items.length;i++){
    		$scope.entity.itemList=addColumn($scope.entity.itemList,items[i].attributeName,items[i].attributeValue);

		}

    }
    //添加列
    addColumn=function (list,columnName,columnValues) {
		var newList=[];//新的集合
		for (var i=0;i<list.length;i++){
			var oldRow = list[i];
			for (var j=0;j<columnValues.length;j++){
				var newRow = JSON.parse(JSON.stringify(oldRow));// 深克隆
				newRow.spec[columnName]=columnValues[j];
				newList.push(newRow);
			}

		}
		return newList;
    }


    clearGuigeTable=function () {
    	// alert("123");
        $("#guigeTable").val("");
    }

    // 定义商品四中状态
    $scope.status = ['未审核','已审核','审核未通过','关闭'];// 商品状态
    $scope.itemCatList=[];// 商品分类列表
	// 加载商品分类列表,以数组形式封装
    $scope.findItemCatList=function () {
		itemCatService.findAll().success(
			function (response) {
				for (var i=0;i<response.length;i++){
					$scope.itemCatList[response[i].id] = response[i].name;
				}
            }
		)
    }

    //查询实体
	$scope.findOne=function () {
		var id = $location.search()['id'];// 获取参数值
		if (id == null){
			return;
		}
		goodsService.findOne(id).success(
			function (response) {
				$scope.entity=response;
            }
		)

		// 向富文本编辑器添加商品介绍
		editor.html($scope.entity.goodsDesc.introduction);

		// 显示图片列表
		$scope.entity.goodsDesc.itemImages = JSON.parse($scope.entity.goodsDesc.itemImages);

		//显示拓展属性
		$scope.entity.goodsDesc.customAttributeItems = JSON.parse($scope.entity.goodsDesc.customAttributeItems);

		// 规格
		$scope.entity.goodsDesc.specificationItems = JSON.parse($scope.entity.goodsDesc.specificationItems);
    }

    // 根据规格名称和选项名称返回是否被勾选
	$scope.checkAttributeValue = function(specName,optionName){
    	var items = $scope.entity.goodsDesc.specificationItems;
    	var object = $scope.searchObjectByKey(items,'attributeName',specName);
    	if (object == null){
    		return false;
		} else{
    		if (object.attributeValue.indexOf(optionName)>=0){
    			return true;
			} else{
    			return false;
			}
		}
	}

	// 上下架操作
    $scope.updateIsMarketable=function (id,status) {
        goodsService.updateIsMarketable(id,status).success(
            function (response) {
                if (response.success){
                    $scope.reloadList();
                    $scope.selectIds=[];
                } else {
                    alert(response.message);
                }
            }
        )
    }


});	
