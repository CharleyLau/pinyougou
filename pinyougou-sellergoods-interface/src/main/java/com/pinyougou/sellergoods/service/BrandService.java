package com.pinyougou.sellergoods.service;

import com.pinyougou.pojo.TbBrand;
import entity.PageResult;

import java.util.List;
import java.util.Map;

/**
 * 品牌接口
 */
public interface BrandService {
    public List<TbBrand> findAll();

    public void add(TbBrand brand);

    public void update(TbBrand brand);

    TbBrand findOne(Long id);

    void delete(Long[] ids);

    public PageResult findPage(TbBrand brand, int page, int rows);

    List<Map> selectOptionList();
}
