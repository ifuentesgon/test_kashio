module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['src/steps/**/*.ts', 'src/support/**/*.ts'],
    format: ['summary', 'html:reports/cucumber-report.html'],
    paths: ['features/**/*.feature']
  }
}