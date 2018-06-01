package com.pinyougou.search.service.impl;

import com.alibaba.dubbo.config.annotation.Service;
import com.pinyougou.pojo.TbItem;
import com.pinyougou.search.service.ItemSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.solr.core.SolrTemplate;
import org.springframework.data.solr.core.query.*;
import org.springframework.data.solr.core.query.result.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service(timeout = 3000)
public class ItemSearchServiceImpl implements ItemSearchService {
	@Autowired
	private SolrTemplate solrTemplate;

	@Autowired
	private RedisTemplate redisTemplate;

	@Override
	public Map<String, Object> search(Map searchMap) {
		/*Map<String,Object> map=new HashMap<>();
		Query query=new SimpleQuery();
		//添加查询条件
		Criteria criteria=new Criteria("item_keywords").is(searchMap.get("keywords"));
		query.addCriteria(criteria);
		ScoredPage<TbItem> page = solrTemplate.queryForPage(query, TbItem.class);
		map.put("rows", page.getContent());
		return map;*/

		// 处理空格
		String keywords = (String) searchMap.get("keywords");
		searchMap.put("keywords",keywords.replace(" ",""));

		//使用高亮显示
		Map<String,Object> map=new HashMap<>();
		// 1.查询列表
		map.putAll(searchList(searchMap));

		// 2.根据关键字查询商品分类
		List<String> categoryList = searchCategoryList(searchMap);
		map.put("categoryList",categoryList);

		// 3.查询品牌和规格列表
		String category = (String) searchMap.get("category");
		if (!category.equals("")){
			map.putAll(searchBrandAndSpecList(category));
		}else{
			if (categoryList.size()>0){
				map.putAll(searchBrandAndSpecList(categoryList.get(0)));
			}
		}

		return map;
	}

	@Override
	public void importList(List list) {
		solrTemplate.saveBeans(list);
		solrTemplate.commit();
	}

	@Override
	public void deleteByGoodsIds(List goodsIdList) {
		System.out.println("ItemSearchServiceImpl删除商品ID"+goodsIdList);
		Query query=new SimpleQuery();
		Criteria criteria=new Criteria("item_goodsid").in(goodsIdList);
		query.addCriteria(criteria);
		solrTemplate.delete(query);
		solrTemplate.commit();
	}

	/**
	 * 高亮显示;根据关键字搜索列表
	 */
	private Map searchList(Map searchMap){
		Map map = new HashMap();
		// 高亮选项初始化
		HighlightQuery query = new SimpleHighlightQuery();
		HighlightOptions highlightOptions = new HighlightOptions().addField("item_title");//设置高亮显示的域
		highlightOptions.setSimplePrefix("<em style='color:red'>");// 高亮前缀
		highlightOptions.setSimplePostfix("</em>");// 高亮后缀
		query.setHighlightOptions(highlightOptions);// 搜索项设置高亮选项

		// 1.按照关键字查询
		Criteria criteria = new Criteria("item_keywords").is(searchMap.get("keywords"));
		query.addCriteria(criteria);

		// 2.按照商品分类过滤
		if (!"".equals(searchMap.get("category"))){
			// 如果用户选择了分类
			FilterQuery filterQuery = new SimpleFilterQuery();
			Criteria filterCriteria = new Criteria("item_category").is(searchMap.get("category"));
			filterQuery.addCriteria(filterCriteria);
			query.addFilterQuery(filterQuery);
		}

		// 1.3 按照品牌过滤
		if (!"".equals(searchMap.get("brand"))){
			// 如果用户选择了品牌
			FilterQuery filterQuery = new SimpleFilterQuery();
			Criteria filterCriteria = new Criteria("item_brand").is(searchMap.get("brand"));
			filterQuery.addCriteria(filterCriteria);
			query.addFilterQuery(filterQuery);
		}

		// 4.按照规格过滤
		if (searchMap.get("spec")!=null){
			Map<String,String> specMap = (Map<String, String>) searchMap.get("spec");
			for (String key:specMap.keySet()){

				FilterQuery filterQuery = new SimpleFilterQuery();
				Criteria filterCriteria = new Criteria("item_spec"+key).is(specMap.get(key));
				filterQuery.addCriteria(filterCriteria);
				query.addFilterQuery(filterQuery);
			}
		}

		// 5.按照价格筛选
		if (!"".equals(searchMap.get("price"))){
			String[] price = ((String)searchMap.get("price")).split("-");
			if (!price[0].equals("0")){
				// 如果价格区间起点不等于0
				Criteria filterCriteria = new Criteria("item_price").greaterThanEqual(price[0]);
				FilterQuery filterQuery = new SimpleFilterQuery(filterCriteria);
				query.addFilterQuery(filterQuery);
			}

			if (!price[1].equals("*")){
				// 如果价格区间终点不等于*
				Criteria filterCriteria = new Criteria("item_price").lessThanEqual(price[1]);
				FilterQuery filterQuery = new SimpleFilterQuery(filterCriteria);
				query.addFilterQuery(filterQuery);
			}
		}

		// 6. 分页
		Integer pageNo = (Integer) searchMap.get("pageNo");
		if (pageNo == null){
			pageNo=1;
		}
		Integer pageSize = (Integer) searchMap.get("pageSize");
		if (pageSize == null){
			pageSize=20;
		}

		query.setOffset( (pageNo-1)*pageSize);// 起始索引
		query.setRows(pageSize);

		// 7 排序
		String sortValue= (String)searchMap.get("sort");//升序ASC 降序DESC
		String sortField=  (String)searchMap.get("sortField");//排序字段

		if(sortValue!=null && !sortValue.equals("")){

			if(sortValue.equals("ASC")){
				Sort sort=new Sort(Sort.Direction.ASC, "item_"+sortField);
				query.addSort(sort);
			}
			if(sortValue.equals("DESC")){
				Sort sort=new Sort(Sort.Direction.DESC, "item_"+sortField);
				query.addSort(sort);
			}
		}

		// 得到查询结果,高亮显示对象
		HighlightPage<TbItem> page = solrTemplate.queryForHighlightPage(query,TbItem.class);
		// 高亮入口集合(每条记录的高亮入口)
		List<HighlightEntry<TbItem>> highlighted = page.getHighlighted();
		for (HighlightEntry<TbItem> entry:highlighted){// 循环高亮入口集合
			// 获取高亮列表(高亮域的个数)
			List<HighlightEntry.Highlight> highlightList = entry.getHighlights();

			// 如果存在高亮域和入口集合
			if (highlightList.size()>0 && highlightList.get(0).getSnipplets().size()>0){
				TbItem item = entry.getEntity();
				// 因为我们明确知道只有一个高亮入口和一个高亮域,所以不遍历 直接取第一个
				item.setTitle(highlightList.get(0).getSnipplets().get(0));
			}
		}
		map.put("rows",page.getContent());
		map.put("totalPages",page.getTotalPages());// 总页数
		map.put("total",page.getTotalElements());// 总记录数

		return map;
	}

	/**
	 * 分组查询(查询商品分类列表)
	 */
	private  List searchCategoryList(Map searchMap){
		List<String> list=new ArrayList();
		Query query=new SimpleQuery();
		//按照关键字查询
		Criteria criteria=new Criteria("item_keywords").is(searchMap.get("keywords"));
		query.addCriteria(criteria);
		//设置分组选项
		GroupOptions groupOptions=new GroupOptions().addGroupByField("item_category");
		query.setGroupOptions(groupOptions);
		//得到分组页
		GroupPage<TbItem> page = solrTemplate.queryForGroupPage(query, TbItem.class);
		//根据列得到分组结果集
		GroupResult<TbItem> groupResult = page.getGroupResult("item_category");
		//得到分组结果入口页
		Page<GroupEntry<TbItem>> groupEntries = groupResult.getGroupEntries();
		//得到分组入口集合
		List<GroupEntry<TbItem>> content = groupEntries.getContent();
		for(GroupEntry<TbItem> entry:content){
			list.add(entry.getGroupValue());//将分组结果的名称封装到返回值中
		}
		return list;
	}

	/**
	 * 根据商品分类名称查询品牌和规格列表
	 */
	private Map searchBrandAndSpecList(String category){
		Map map = new HashMap();
		// 1.根据商品模板ID获取品牌列表
		Long templateId = (Long) redisTemplate.boundHashOps("itemCat").get(category);
		if (templateId != null){
			// 2.根据模板id查询品牌列表
			List brandList = (List) redisTemplate.boundHashOps("brandList").get(templateId);
			map.put("brandList",brandList);// 返回值添加品牌列表

			// 3.根据模板id规格列表
			List specList = (List) redisTemplate.boundHashOps("specList").get(templateId);
			map.put("specList",specList);
		}
		return map;

	}
}
