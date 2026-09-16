'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {confidence}=require('../src/rating/universal/confidence');
const {safeView}=require('../src/profile/universal-rating-adapter');
const {buildMain}=require('../tools/research/universal-rating-r1-build-physical-shadow-rc-kit');

test('missing estimator uncertainty uses sample proxy instead of zero-width certainty',()=>{
  const c=confidence({games:10,rating:1500,uncertainty:null});
  assert.equal(c.method,'sample_proxy');
  assert.ok(c.uncertainty>0);
  assert.ok(c.lower<1500);
  assert.ok(c.upper>1500);
});

test('missing rating remains null in confidence and profile shadow view',()=>{
  const c=confidence({games:10,rating:null,uncertainty:null});
  assert.equal(c.level,'INSUFFICIENT');
  assert.equal(c.lower,null);
  assert.equal(c.upper,null);
  const view=safeView({status:'INSUFFICIENT_DATA',rating:null,uncertainty:null,games:0},{targetMode:'searched'});
  assert.equal(view.rating,null);
  assert.equal(view.uncertainty,null);
});

test('physical RC uses verified current target contract and requires real dual-shadow estimates',()=>{
  const src=buildMain();
  assert.match(src,/target:\{current:true\}/);
  assert.doesNotMatch(src,/target:null/);
  assert.match(src,/elo\.status==='ESTIMATED_SHADOW'/);
  assert.match(src,/glicko\.status==='ESTIMATED_SHADOW'/);
  assert.match(src,/Number\(elo\.games\)>0/);
  assert.match(src,/Number\(glicko\.games\)>0/);
});
