// The project index moves through visible work; it never hides a project.
document.querySelectorAll('[data-project]').forEach(button=>button.onclick=()=>{
 const target=document.getElementById('project-'+button.dataset.project),stop=route.stops[2];if(!target||!stop)return;
 const state=JourneyModel.sample(currentScroll(),route),top=document.querySelector('.journey-nav').getBoundingClientRect().bottom+20;
 const offset=Math.max(0,Math.min(stop.overflow,state.fromOffset+target.getBoundingClientRect().top-top));
 window.scrollTo({top:stop.start+offset,behavior:'instant'});const heading=target.querySelector('h3');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});requestPaint();
});
const contentObserver=new ResizeObserver(measure);sceneCopies.forEach(copy=>contentObserver.observe(copy));measure();
