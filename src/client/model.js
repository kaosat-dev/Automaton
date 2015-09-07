import Immutable from 'seamless-immutable'
import {Rx} from '@cycle/core'

//import Immutable from 'immutable'
import {modelHelper, makeModifications} from './modelHelper'
import {mergeData} from './utils'

export function intent(DOM){
  let toggleRelay$ =  DOM.get('.relayToggler', 'click')
    //.do(e=>console.log("EVENT relay toggling",e))
    .map(function(e){
      let id = parseInt( e.target.id.split("_").pop() )
      return {id,toggled:e.target.checked}
    })

  let setCoolerPower$ = DOM.get('.coolerSlider','input')//input vs change events
    .merge( DOM.get('.coolerSlider_number','change') )
    //DOM.get('.coolerSlider_number','change')
    .debounce(30)
    .map(function(e){
      let id = parseInt( e.target.id.split("_").pop() )
      let value = parseFloat(e.target.value)
      return {id,value}
    })
  

  let emergencyShutdown$ = DOM.get('#shutdown', 'click')
    .map(false)


  let undo$ = DOM.get('#undo','click')
    .map(true)

  let redo$ = DOM.get('#redo','click')
    .map(false)


  return {
    toggleRelay$
    ,emergencyShutdown$
    ,setCoolerPower$
    , undo$
    , redo$}
}




//these all are actual "api functions"  
function toggleRelay(state, input){
  let relays = state.relays
    .map(function(relay,index){
      if(index === input.id){
        return {name:relay.name,toggled:input.toggled}
      }
      return relay
    })

  state = mergeData( state, {active:true, relays})//toggleRelays(state,toggleInfo) )
  return state
}

function emergencyShutdown(state, input){
  let relays = state.relays
    .map( relay => ({ name:relay.name, toggled:input}) )

  state = mergeData( state, [{active:input}, {relays}] )
  return state
}

function setCoolerPower(state, input){
  let coolers = state.coolers
    .map(function(cooler,index){
      if(index === input.id){
        return mergeData(cooler, {power:input.value})
      }
      return cooler
    })

  state = mergeData( state, [{active:input!==undefined}, {coolers}] )
  return state
}

export function model(actions){

    const defaults = Immutable(
      { 
        state:{
          active:true,

          relays:[
             {toggled:false,name:"relay0"}
            ,{toggled:false,name:"relay1"}
            ,{toggled:true, name:"relay2"}
          ]
          ,
          coolers:[
            {toggled:true,power:10,name:"cooler0"}
            ,{toggled:true,power:72.6,name:"cooler1"}
          ]
        }
        //only for undo/redo , experimental
        ,history:{
          past:[]
          ,future:[]
        }
      }
    )

    /*list of "update functions", to be called based on mapping 
    between action names & update functions
    ie if you have an "action" called doFoo$, you should specify an function called doFoo(state,input)
    ie doFoo$ ---> function doFoo(state,input){}
    */
    let updateFns = {setCoolerPower,emergencyShutdown,toggleRelay}
    let mods$ =  makeModifications(actions,updateFns)

    let source$ =  Rx.Observable.just(defaults)

    return mods$
      .merge(source$)
      .scan((currentData, modFn) => modFn(currentData))//combine existing data with new one
      //.distinctUntilChanged()
      .shareReplay(1)
  

  }