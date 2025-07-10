import yaml from 'js-yaml';

export function formatYaml(data: unknown): string {
  // Return empty string for undefined
  if (data === undefined) {
    return '';
  }

  // js-yamlのdump関数を使用してYAML形式に変換
  // 循環参照はYAMLアンカー/エイリアスで処理される
  return yaml.dump(data);
}
