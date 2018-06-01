package com.pinyougou.search.service;

import java.util.List;
import java.util.Map;

/**
 * 搜索接口层
 */
public interface ItemSearchService {
	public Map<String,Object> search(Map searchMap);

	/**
	 * 更新到索引库
	 * 导入数据
	 * @param list
	 */
	public void importList(List list);

	public void deleteByGoodsIds(List goodsIdList);

}
