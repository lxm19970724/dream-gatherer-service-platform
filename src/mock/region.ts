/**
 * 离线地区数据（画板 v23 / my-map 使用）。
 * 仅内置静态三级省市区树与简化中国轮廓 SVG，零外部请求、零地图服务依赖。
 */
import type { RegionNode } from '@/types'

export const REGION_TREE: RegionNode[] = [
  {
    code: '44', name: '广东省', children: [
      { code: '4403', name: '深圳市', children: [{ code: '440305', name: '南山区' }, { code: '440304', name: '福田区' }] },
      { code: '4401', name: '广州市', children: [{ code: '440106', name: '天河区' }, { code: '440103', name: '荔湾区' }] },
    ],
  },
  {
    code: '33', name: '浙江省', children: [
      { code: '3301', name: '杭州市', children: [{ code: '330106', name: '西湖区' }, { code: '330108', name: '滨江区' }] },
    ],
  },
  {
    code: '32', name: '江苏省', children: [
      { code: '3201', name: '南京市', children: [{ code: '320106', name: '鼓楼区' }, { code: '320102', name: '玄武区' }] },
    ],
  },
  {
    code: '51', name: '四川省', children: [
      { code: '5101', name: '成都市', children: [{ code: '510107', name: '武侯区' }, { code: '510104', name: '锦江区' }] },
    ],
  },
  {
    code: '11', name: '北京市', children: [
      { code: '1101', name: '北京市', children: [{ code: '110105', name: '朝阳区' }, { code: '110108', name: '海淀区' }] },
    ],
  },
  {
    code: '31', name: '上海市', children: [
      { code: '3101', name: '上海市', children: [{ code: '310115', name: '浦东新区' }, { code: '310101', name: '黄浦区' }] },
    ],
  },
  {
    code: '42', name: '湖北省', children: [
      { code: '4201', name: '武汉市', children: [{ code: '420111', name: '洪山区' }, { code: '420102', name: '江岸区' }] },
    ],
  },
]

/** 中国轮廓简化 path（内联 SVG，非精确测绘数据，仅作分布示意） */
export const REGION_SVG_PATH =
  'M96 54 L152 40 L210 52 L256 44 L312 58 L358 50 L408 66 L446 88 L470 122 L452 150 L466 184 L438 210 L448 246 L410 278 L372 300 L330 328 L286 350 L244 336 L206 308 L168 292 L136 258 L110 226 L90 188 L72 150 L78 108 Z'

/** 地区节点扁平化，供 Cascader / 搜索使用 */
export function flattenRegions(nodes: readonly RegionNode[]): RegionNode[] {
  const result: RegionNode[] = []
  const walk = (list: readonly RegionNode[]): void => {
    list.forEach((node) => {
      result.push(node)
      if (node.children) walk(node.children)
    })
  }
  walk(nodes)
  return result
}

/** 根据省市区名称查找地区码 */
export function findRegionCode(province: string, city: string, district: string): string {
  const target = flattenRegions(REGION_TREE).find(
    (node) => node.name === district || node.name === city || node.name === province,
  )
  return target?.code ?? ''
}
