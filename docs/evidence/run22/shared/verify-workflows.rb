require 'yaml'
require 'json'
native=YAML.load_file('.github/workflows/native-builds.yml')
ci=YAML.load_file('.github/workflows/ci.yml')
jobs=native.fetch('jobs')
raise 'audit dependency hides builds' if jobs.fetch('native').key?('needs')
raise 'private refs unrestricted' unless jobs['native']['if']=="github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'"
raise 'native parallelism' unless jobs['native'].fetch('strategy')['max-parallel']==1
raise 'private runner labels' unless jobs['native']['runs-on']==['self-hosted','macOS','ARM64','nato-phonetics']
['checks','native'].each do |name|
 steps=jobs[name].fetch('steps')
 raise 'shared entry absent' unless steps.any?{|s|s['run'].to_s.include?('scripts/host-build.cjs') && s['run'].include?('--install')}
 upload=steps.find{|s|s['uses']=='actions/upload-artifact@v4'}
 raise 'logs missing on failure' unless upload && upload['if']=='always()' && upload['with']['if-no-files-found']=='error'
end
web=ci['jobs']['web-distribution']
raise 'web matrix drift' unless web['strategy']['matrix']['engine']==['chromium','firefox','webkit']
raise 'web shared path missing' unless web['steps'].any?{|s|s['run'].to_s.include?('host-build.cjs web --install')}
raise 'old archive path' unless web['steps'].any?{|s|s['run'].to_s.include?('verify-web-host.cjs artifacts/web-distribution/build/nato-web.tar.gz')}
puts JSON.pretty_generate({result:'pass',nativeJobs:jobs.keys,privateRefs:['main','develop'],matrixParallelism:1,auditIndependent:true,uploadsOnFailure:true,webEngines:web['strategy']['matrix']['engine'],hostedExecution:'unrun'})
