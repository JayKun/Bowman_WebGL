var audio1 = new Audio('epic.wav');
audio1.play();

Declare_Any_Class( "Bowman",  // An example of drawing a hierarchical object using a "model_transform" matrix and post-multiplication.
  { 'construct'( context )
      { 
      context.globals.animate = true;
      var shapes = {  
                       "tree": new Shape_From_File( "lowtree.obj" ),
                       "stone1": new Shape_From_File( "stone1.obj" ),
                       "stone2": new Shape_From_File( "stone2.obj" ),
                       "stone3": new Shape_From_File( "stone3.obj" ),
                       "grass": new Shape_From_File("grass.obj"),
                       "sphere": new Grid_Sphere(30, 30 ),
                       "arrow_body":new Capped_Cylinder(20,20),
                       "ground": new Square() ,
                       "bow_segment": new Capped_Cylinder(20, 20),
                       "arrow_head": new Tri(),
                       "cube": new Tri(),
                       "collider" : new Subdivision_Sphere(1),
                       "text": new Text_Line( 35 )
                   };
        this.submit_shapes( context, shapes );
        
        this.define_data_members( { 
                                    /*target data*/
                                    x1:0,
                                    y1:0,
                                    z1:0,
                                    x2:0,
                                    y2:0,
                                    z2:0,
                                    start:false,
                                    targets:[],
                                    
                                    /*game data*/
                                    start_game:false,
                                    arrows_left:5,
                                    game_over:false,
                                    text_graphics_state: new Graphics_State(),
                                    state: context.globals.graphics_state ,
                                    camera_view:0,
                                    score: 0, 
                                    time:6000,
                                    level:1,

                                    /*arrow data*/
                                    arrow_x: 0,
                                    arrow_y: 1,
                                    arrow_z: 12,
                                    angle: 0,
                                    shoot:false,
                                    fire_arrow:false,

                                    yellow_clay: context.shaders_in_use["Phong_Model"].material( Color(  1,  1, .3, 1 ), .2, 1, .7, 40 ),
                                    green_solid: context.shaders_in_use["Phong_Model"].material( Color( .3, .8, .2, 1 ), .2, 1,  1, 40 ), 
                                    orangePlastic  : context.shaders_in_use["Phong_Model" ].material( Color( 1,.5,.3, 1 ), .4, .8, .4, 20 ),
                                    brownPlastic  : context.shaders_in_use["Phong_Model" ].material( Color( .82,.7,.55, 1 ), .4, .8, .4, 20 ),
                                    blueGlass    : context.shaders_in_use["Phong_Model" ].material( Color( .5,.5, 1.2, 1), .4, .8, .4, 40 ),
                                    redPlastic: context.shaders_in_use["Phong_Model" ].material( Color( 2,.2,.3, 1 ), .4, .8, .4, 20 ),
                                    cloud        : context.shaders_in_use["Phong_Model"].material( Color( 0, 0, 0, 1 ), 1, 0, 0, 40, context.textures_in_use["cloud.jpg"]),
                                    purplePlastic: context.shaders_in_use["Phong_Model" ].material( Color( .9,.5,.9, 1 ), .4, .4, .8, 40 ),
                                    wood  : context.shaders_in_use["Phong_Model" ].material( Color( 0,0,0,1 ), 1, 0, 0, 40, context.textures_in_use["dummy_wood.jpg"]),
                                    rocky : context.shaders_in_use["Phong_Model" ].material( Color( 0,0,0,1 ), 1, 0, 0, 40, context.textures_in_use["rocky.jpg"]),
                                    grass  : context.shaders_in_use["Phong_Model" ].material( Color( 0,0, 0, 1 ), 1, 0, 0, 40, context.textures_in_use["grass.jpg"]),
                                    fire  : context.shaders_in_use["Phong_Model" ].material( Color( 0,.3, 0 ,.5 ), 1, 0, 0, 40, context.textures_in_use["fire.png"]),
                                    stars  : context.shaders_in_use["Phong_Model" ].material( Color( 0,0, 0, 1 ), 1, 0, 0, 40, context.textures_in_use["stars.png"]),
                                    text_material: context.shaders_in_use["Phong_Model"].material( Color(  0, 0, 0, 1 ), 1, 0, 0, 40, context.textures_in_use["text.png"] ) } );  
      },        
      'init_keys'( controls )   // init_keys():  Define any extra keyboard shortcuts here
      { 
        controls.add( "l", this, function() { this.arrow_x +=1; } ); controls.add( "j", this, function() { this.arrow_x -=1; } );
        controls.add( "i", this, function() { this.angle +=1; } ); controls.add( "k", this, function() { this.angle -=1; } );
        controls.add( "0", this, function() { this.shoot = true; this.arrows_left--;} );  controls.add( "r", this, function() { this.restart_game(); } ); 
        controls.add( "9", this, function() { this.fire_arrow = true; } );
        controls.add( "8", this, function() { this.camera_view = 1; } );
        controls.add( "Space", this, function() { this.start_game = true; } );
        controls.add( "8", this, function() { this.camera_view = 0; }, {'type':'keyup'} );

      },

      'update_strings'( debug_screen_object)   // Strings that this Scene_Component contributes to the UI:
      { 
          debug_screen_object.string_map["framerate"]= "Frame Rate: "+ 1000/this.state.animation_delta_time;

      },  

      'draw_target'(graphics_state, x ,y ,z){  
        var t = (graphics_state.animation_time);


        // Draw Target Body
        var model_transform=mult(translation(0, 0, -40), this.level==1? translation((x%20+5)*Math.sin(t/1000),0 ,0):rotation( (Math.abs(x-y)%2+1)*t/20, 0, 1, 0));
        model_transform=mult(model_transform, translation(x, y, z));
        model_transform=mult(model_transform, rotation(90, 0 ,1,0));
        body_origin=mult(model_transform, scale(2,2,2));
        this.shapes.sphere.draw(graphics_state, body_origin, this.purplePlastic);

        //Draw Target Left Wing
        var left_wing_hinge=mult(body_origin, translation(0, 0, 1));
        left_wing_hinge=mult(left_wing_hinge, rotation(30*Math.cos(radians(t)), -1, 0, 0))
        model_transform=mult(left_wing_hinge, translation(0, 0, 3));
        model_transform=mult(model_transform, scale(1, 0.1, 3));
        this.shapes.cube.draw(graphics_state, model_transform, this.redPlastic);
        model_transform=mult(left_wing_hinge, translation(0, 0, 6));
        model_transform=mult(model_transform, rotation(20*Math.sin(t*10), 1, 0, 0));
        this.shapes.arrow_head.draw(graphics_state, mult(model_transform, scale(1, 0.1, 1)), this.orangePlastic);

        //Draw Target Right Wing
        var right_wing_hinge=mult(body_origin, translation(0, 0, -1));
        right_wing_hinge=mult(right_wing_hinge, rotation(30*Math.cos(radians(t)), 1, 0, 0))
        model_transform=mult(right_wing_hinge, translation(0, 0, -3));
        model_transform=mult(model_transform, scale(1, 0.1, 3));
        this.shapes.cube.draw(graphics_state, model_transform, this.redPlastic);
        model_transform=mult(right_wing_hinge, translation(0, 0, -6));
        model_transform=mult(model_transform, rotation(180 + 20*Math.sin(radians(t)), -1, 0, 0));
        this.shapes.arrow_head.draw(graphics_state, mult(model_transform, scale(1, 0.1, 1)), this.orangePlastic);

        return body_origin;
      },

      'draw_bow'(graphics_state, arrow_head_transform){
         /**RIGHT PORTION BOW SET UP**/
        model_transform=mult(this.shoot? identity():arrow_head_transform, translation(this.arrow_x, 0, 12));
        model_transform=mult(model_transform, translation(0, -3.2, 0));
        model_transform=mult(model_transform, rotation(90, 0, 1, 0));
        model_transform=mult(model_transform, scale(0.1, 0.1, 0.5));
        this.shapes.bow_segment.draw(graphics_state, model_transform, this.redPlastic);

        for (var i = 0; i < 7; i++) {
        model_transform=mult(model_transform, scale(1/0.1, 1/0.1, 2));
        model_transform=mult(model_transform, rotation(-90, 0, 1, 0));
        model_transorm=mult(model_transform, translation(0.5, 0, 0));
        model_transform=mult(model_transform, rotation(5, 0, -1, 0));
        model_transform=mult(model_transform, translation(0.5, 0, 0));
        model_transform=mult(model_transform, rotation(90, 0, 1, 0));
        model_transform=mult(model_transform, scale(0.1, 0.1, 0.5));
        this.shapes.bow_segment.draw(graphics_state, model_transform, this.orangePlastic);
        }   
        model_transform=mult(model_transform, scale(1/0.1, 1/0.1, 2));
        model_transform=mult(model_transform, rotation(-90, 0, 1, 0));
        model_transform=mult(model_transform, translation(0.5, 0 ,0));
        model_transform=mult(model_transform, scale(0.5, 0.5, 1));
        this.shapes.arrow_head.draw(graphics_state, model_transform, this.stars);

        /**LEFT PORTION BOW SET UP**/
        model_transform=mult(this.shoot? identity():arrow_head_transform,translation(this.arrow_x, 0, 12));
        model_transform=mult(model_transform, translation(0, -3.2, 0));
        model_transform=mult(model_transform, rotation(90, 0, 1, 0));
        model_transform=mult(model_transform, scale(0.1, 0.1, 0.5));
        this.shapes.bow_segment.draw(graphics_state, model_transform, this.redPlastic);

        for (var i = 0; i < 7; i++) {
        model_transform=mult(model_transform, scale(1/0.1, 1/0.1, 2));
        model_transform=mult(model_transform, rotation(-90, 0, 1, 0));
        model_transorm=mult(model_transform, translation(-0.5, 0, 0));
        model_transform=mult(model_transform, rotation(5, 0, 1, 0));
        model_transform=mult(model_transform, translation(-0.5, 0, 0));
        model_transform=mult(model_transform, rotation(90, 0, 1, 0));
        model_transform=mult(model_transform, scale(0.1, 0.1, 0.5));
        this.shapes.bow_segment.draw(graphics_state, model_transform, this.orangePlastic);
        } 
        model_transform=mult(model_transform, scale(1/0.1, 1/0.1, 2));
        model_transform=mult(model_transform, rotation(-90, 0, 1, 0));
        model_transform=mult(model_transform, translation(-0.5, 0 ,0));
        model_transform=mult(model_transform, scale(0.5, 0.5, 1));
        this.shapes.arrow_head.draw(graphics_state, model_transform, this.stars);

      },

      'draw_scene'(graphics_state){
        var t = graphics_state.animation_time/1000;
        /**GROUND**/    
        var model_transform=mult(identity() , translation(0,-5,0));
        model_transform=mult(model_transform, rotation(90,1,0,0));
        model_transform=mult(model_transform, scale(100, 100, 100));
        this.shapes.ground.draw(graphics_state, model_transform, this.grass);

        /**GRASS**/
        for (var i = 1; i < 8; i++) {
        model_transform=mult(translation(-5 + i%3 , -3.6, i*1.5-5), rotation(90, 0, 1, 0));
        model_transform=mult(model_transform, scale(1, 0.5, 1));
        this.shapes.grass.draw(graphics_state, model_transform, this.green_solid);
        }

        for (var i = 1; i < 8; i++) {
        model_transform=mult(translation(10 + i%3 , -3.6, i*1.5-5), rotation(90, 0, 1, 0));
        model_transform=mult(model_transform, scale(1, 0.5, 1));
        this.shapes.grass.draw(graphics_state, model_transform, this.green_solid);
        }

        /**Trees**/
        for (var i = 1; i < 4 ; i++) {
            model_transform=mult(translation(22 + i%2 , -2, i*2.5), scale(2, 2, 2));
            this.shapes.tree.draw(graphics_state, model_transform, this.green_solid);
        }
        for (var i = 1; i < 4; i++) {
            model_transform=mult(translation(21 + i%2 , -2, i*2.5), scale(2, 2, 2));
            this.shapes.tree.draw(graphics_state, model_transform, this.green_solid);
        }

        for (var i = 1; i < 4; i++) {
            model_transform=mult(translation(-22 + i%2 , -2, i*2.5), rotation(90, 0, 1, 0));
            model_transform=mult(model_transform, scale(2, 2, 2));
            this.shapes.tree.draw(graphics_state, model_transform, this.green_solid);
        }1

            for (var i = 1; i < 4; i++) {
            model_transform=mult(translation(-23 + i%2 , -2, i*2.5), rotation(90, 0, 1, 0));
            model_transform=mult(model_transform, scale(2, 2, 2));
            this.shapes.tree.draw(graphics_state, model_transform, this.green_solid);
        }

         /**STONES**/
         model_transform=mult(translation(12, -4 , 1), scale(.5, .5, .5));
         this.shapes.stone1.draw(graphics_state, model_transform, this.yellow_clay);

         model_transform=mult(translation(12.5, -4 , 3), scale(.5, .5, .5));
         this.shapes.stone2.draw(graphics_state, model_transform, this.yellow_clay);

         model_transform=mult(translation(12.5, -4 , 6), scale(.5, .5, .5));
         this.shapes.stone2.draw(graphics_state, model_transform, this.yellow_clay);

         model_transform=mult(translation(-10, -4 , 1), scale(.5, .5, .5));
         this.shapes.stone3.draw(graphics_state, model_transform, this.yellow_clay);

         model_transform=mult(translation(-9, -4 , 8), scale(.5, .5, .5));
         this.shapes.stone2.draw(graphics_state, model_transform, this.yellow_clay);



      },
      'restart_game' (graphics_state){
            this.x1=0;
            this.y1=0;
            this.z1=0;
            this.start=false;
            this.score= 0;
            this.arrows_left=5,
            this.target=false;
            this.arrow_x= 0;
            this.arrow_y= 1;
            this.arrow_z= 12;
            this.angle= 0;
            this.targets=[];
            this.camera_view=0;
            this.shoot=false;
            this.fire_arrow=false;
            this.game_over=false;
            this.level=1;
            this.time=600;
      },
      'game_over_screen'()
      {
         var font_scale = scale( .02, .04, 1 );

          model_transform   = mult( translation( -.31, .4, 0 ), scale(.04, .08 , 2));
          this.shapes.text.set_string( "GAME OVER");  
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.25, .2, 0 ), font_scale );
          this.shapes.text.set_string( "Your score: " + String(this.score) );
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.3, 0, 0 ), font_scale );
          this.shapes.text.set_string( "Press r to restart" );
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

      },
      'start_screen' (){

          /**DISPLAY INSTRUCTIONS**/
          var font_scale = scale( .02, .04, 1 );

          model_transform   = mult( translation( -.2, .8, 0 ), scale(.04, .08 , 2));
          this.shapes.text.set_string( "Crossbow");  
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.5, .6, 0 ), scale(.02, .04, 1) );
          this.shapes.text.set_string( "INSTRUCTIONS :");
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.5, .4, 0 ), font_scale );
          this.shapes.text.set_string( "Keys j and l to move");
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.5, .3, 0 ), font_scale );
          this.shapes.text.set_string( "Keys i and k to aim" );
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.5, .2, 0 ), font_scale );
          this.shapes.text.set_string( "Key 0 to shoot" );
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.5, .1, 0 ), font_scale );
          this.shapes.text.set_string( "Key 8 to swicth camera view" );
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.5, 0, 0 ), font_scale );
          this.shapes.text.set_string( "Key 9 to activate fire arrow" );
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.5, -.1, 0 ), font_scale );
          this.shapes.text.set_string( "Key r to restart" );
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

          model_transform   = mult( translation( -.5, -.3, 0 ), scale(.02, .04, 1) );
          this.shapes.text.set_string( "Press space to START");
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);



      },


      'check_if_colliding'(arrow_model, target_model)   // Collision detection function
      { 
            var T = mult( inverse(arrow_model), target_model );  // Convert sphere b to a coordinate frame where a is a unit sphere
            for( let p of  this.shapes.collider.positions)                                      // For each vertex in that b,
            { 
              var Tp = mult_vec( T, p.concat(1) ).slice(0,3);                    // Apply a_inv*b coordinate frame shift
              this.test= dot(Tp, Tp);
              if( dot( Tp, Tp ) < 200 )   return true;     // Check if in that coordinate frame it penetrates the unit sphere at the origin.     
            }
            return false;
      },

    'display'( graphics_state )
    { 
    if(this.arrows_left == -1)
      this.game_over=true;

    if(this.game_over){
      this.game_over_screen();
      return;
    }

    if(!this.start_game){
      this.start_screen(); 
      return;
    }
    /**DISPLAY SCORE**/
    var font_scale = scale( .02, .04, 1 );
    model_transform   = mult( translation( .5, .9, 0 ), font_scale );
    this.shapes.text.set_string( "Score: " + String(this.score) );
    this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

    model_transform   = mult( translation( .5, .8, 0 ), font_scale );
    this.shapes.text.set_string( "Arrows left: " + String(this.arrows_left) );  
    this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);

    model_transform   = mult( translation( .5, .7, 0 ), font_scale );
    this.shapes.text.set_string( "Level: " + String(this.level) );  
    this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);


    /**DRAW SCENE**/
    this.draw_scene(graphics_state);

    /**COLLIDING BODIES DECLARATION**/
    var bodies =[]; 
    var t = graphics_state.animation_time/1000;

    /**TARGETS**/
    if(!this.start){
      this.x1=Math.floor(Math.random() * (60)) - 30;
      this.y1=Math.floor(Math.random() * 20);
      this.z1=Math.floor(Math.random() * (-30 + 20)) -20;
      this.x2=Math.floor(Math.random() * (60)) - 30;
      this.y2=Math.floor(Math.random() * 20);
      this.z2=Math.floor(Math.random() * (-30 + 20)) -20;
      this.start=true;
    }

    this.targets.push(this.draw_target(graphics_state, this.x1, this.y1, this.z1));
    this.targets.push(this.draw_target(graphics_state, this.x2, this.y2, this.z2));

    /**ARROW**/
    if(this.arrow_x > 14)
      this.arrow_x=14;
    else if(this.arrow_x < -14)
      this.arrow_x = -14;

    //Make sure arrow does not go out of bounds
      if(this.arrow_y < -4){
        this.shoot=false;
        this.angle=0;
        this.fire_arrow=false;
      }
      if(this.arrow_z < -80){
        this.shoot=false;
        this.angle=0;
        this.fire_arrow=false;
      }
      model_transform=translation( this.arrow_x, this.arrow_y-4 , this.arrow_z);

    // Adjust arrow angle
        model_transform=mult(model_transform, translation(0,0,5));
        if(this.angle < 45 && this.angle >= 0 )
          model_transform=mult(model_transform, rotation(this.angle, 1, 0, 0 ))
        else if(this.angle <= 0)
          this.angle=0; 
        else if(this.angle>=45)
          this.angle=45;
        model_transform=mult(model_transform, translation(0, 0 ,-5));
        var arrow_head_transform = model_transform; 
        arrow_head_transform=mult(arrow_head_transform, translation(-this.arrow_x, 4-this.arrow_y, -this.arrow_z ));

      model_transform=mult(model_transform, rotation(180, 0, 1, 0));

      var arrow_head;
      if(this.fire_arrow){
        arrow_head = mult(model_transform, scale(.5, .5, .25));
        this.shapes.arrow_head.draw( graphics_state, arrow_head, this.fire);
      }
      else{
        arrow_head = mult(model_transform, scale(.25, .25, .25));
        this.shapes.arrow_head.draw( graphics_state, arrow_head, this.stars);
      }

      model_transform=mult(model_transform,translation(0,0,-2.5));
      this.shapes.arrow_body.draw(graphics_state, mult(model_transform, scale(.1, .1, 5)), this.wood);

  /**DRAW BOW**/
  this.draw_bow(graphics_state, arrow_head_transform);
     

    /**CAMERA**/

    var eye=vec3(this.arrow_x, this.arrow_y, this.shoot ? this.arrow_z : 30);
    var at=vec3(this.arrow_x, this.arrow_y, this.shoot ? this.arrow_z - 10: 10);
    var up = vec3(0, 1, 0);

    if(this.camera_view){
      eye=vec3(60, 15, 10);
      at=vec3(0, 5, -15);
    }

    graphics_state.camera_transform = lookAt(eye, at, up);
    
    if(this.shoot){
        // Let Arrow fly
        var g = 0.5;
        var theta = radians(this.angle);
        this.arrow_z=this.arrow_z- Math.cos(theta)*1.5; 
        this.arrow_y=this.arrow_y + 1.5*Math.sin(theta);
    }

    else{
      this.arrow_z=12;
      this.arrow_y=1;
    }
        
        graphics_state.lights = [ new Light( vec4(  0,  30,  34, 1 ), Color( 0, .4, 0, 1 ), 100 ),
                                  new Light( vec4( -10, -20, -14, 0 ), Color( 1, 1, .3, 1 ), 100 ) ];
        //Check for collision Here
    for( let b of this.targets)
    if( this.check_if_colliding( arrow_head, b) )          // Send the two bodies and the collision shape
      this.score++; 

    if(this.score > 5)
      if(this.level==1){
          while(this.time > 0){
          model_transform   = mult( translation( -.1, .4, 0 ), scale(.04, .08 , 2));
          this.shapes.text.set_string( "LEVEL 2");  
          this.shapes.text.draw( this.text_graphics_state, model_transform, this.text_material);
          this.level=2;
          this.time--;
      }
    }

   this.targets=[];
  }

  }, Scene_Component );

  
  // ******************************************************************
  // The rest of this file is more code that powers the included demos.

Declare_Any_Class( "Debug_Screen",  // Debug_Screen - An example of a Scene_Component that our Canvas_Manager can manage.  Displays a text user interface.
  { 'construct'( context )
      { this.define_data_members( { string_map:    context.globals.string_map, start_index: 0, tick: 0, visible: false, graphics_state: new Graphics_State(),
                                    text_material: context.shaders_in_use["Phong_Model"].material( 
                                                                                Color(  0, 0, 0, 1 ), 1, 0, 0, 40, context.textures_in_use["text.png"] ) } );
        var shapes = { 'debug_text': new Text_Line( 35 ),
                       'cube':   new Cube() };
        this.submit_shapes( context, shapes );
      },
      
    'init_keys'( controls )
      { controls.add( "t",    this, function() { this.visible ^= 1;                                                                                                  } );
        controls.add( "up",   this, function() { this.start_index = ( this.start_index + 1 ) % Object.keys( this.string_map ).length;                                } );
        controls.add( "down", this, function() 
                                    { this.start_index = ( this.start_index - 1   + Object.keys( this.string_map ).length ) % Object.keys( this.string_map ).length; } );
        this.controls = controls;
      },
    'update_strings'( debug_screen_object )   // Strings that this Scene_Component contributes to the UI:
      { debug_screen_object.string_map["tick"]              = "Frame: " + this.tick++;
        debug_screen_object.string_map["text_scroll_index"] = "Text scroll index: " + this.start_index;
      },
    'display'( global_graphics_state )    // Leave these 3D global matrices unused, because this class is instead making a 2D user interface.
      { if( !this.visible ) return;
        var font_scale = scale( .02, .04, 1 ),
            model_transform = mult( translation( -.95, -.9, 0 ), font_scale ),
            strings = Object.keys( this.string_map );
  
        for( var i = 0, idx = this.start_index; i < 4 && i < strings.length; i++, idx = (idx + 1) % strings.length )
        { this.shapes.debug_text.set_string( this.string_map[ strings[idx] ] );
          this.shapes.debug_text.draw( this.graphics_state, model_transform, this.text_material );  // Draw some UI text (each live-updated 
          model_transform = mult( translation( 0, .08, 0 ), model_transform );                      // logged value in each Scene_Component)
        }
        model_transform   = mult( translation( .7, .9, 0 ), font_scale );
        this.  shapes.debug_text.set_string( "Controls:" );
        this.  shapes.debug_text.draw( this.graphics_state, model_transform, this.text_material );  // Draw some UI text

        for( let k of Object.keys( this.controls.all_shortcuts ) )
        { model_transform = mult( translation( 0, -0.08, 0 ), model_transform );
          this.shapes.debug_text.set_string( k );
          this.shapes.debug_text.draw( this.graphics_state, model_transform, this.text_material );  // Draw some UI text (the canvas's key controls)
        }
        var eye=vec3(0, 0, 10);
        var at=vec3(1,5,10);
        var up = vec3(0, 0, 2);
        lookAt(eye, at, up);
      }

  }, Scene_Component );

Declare_Any_Class( "Example_Camera",                  // An example of a Scene_Component that our Canvas_Manager can manage.  Adds both first-person and
  { 'construct'( context, canvas = context.canvas )   // third-person style camera matrix controls to the canvas.
      { // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        context.globals.graphics_state.set( translation(0, 0,-25), perspective(45, context.width/context.height, .1, 1000), 0 );
        this.define_data_members( { graphics_state: context.globals.graphics_state, thrust: vec3(), origin: vec3( 0, 5, 0 ), looking: false } );
        // *** Mouse controls: ***
        this.mouse = { "from_center": vec2() };                           // Measure mouse steering, for rotating the flyaround camera:
        var mouse_position = function( e ) { return vec2( e.clientX - context.width/2, e.clientY - context.height/2 ); };   
        canvas.addEventListener( "mouseup",   ( function(self) { return function(e) 
                                                                      { e = e || window.event;    self.mouse.anchor = undefined;              } } ) (this), false );
        canvas.addEventListener( "mousedown", ( function(self) { return function(e) 
                                                                      { e = e || window.event;    self.mouse.anchor = mouse_position(e);      } } ) (this), false );
        canvas.addEventListener( "mousemove", ( function(self) { return function(e) 
                                                                      { e = e || window.event;    self.mouse.from_center = mouse_position(e); } } ) (this), false );
        canvas.addEventListener( "mouseout",  ( function(self) { return function(e) { self.mouse.from_center = vec2(); }; } ) (this), false );  // Stop steering if the 
      },                                                                                                                                        // mouse leaves the canvas.
    'init_keys'( controls )   // init_keys():  Define any extra keyboard shortcuts here
      { //controls.add( "Space", this, function() { this.thrust[1] = -1; } );     controls.add( "Space", this, function() { this.thrust[1] =  0; }, {'type':'keyup'} );
        controls.add( "z",     this, function() { this.thrust[1] =  1; } );     controls.add( "z",     this, function() { this.thrust[1] =  0; }, {'type':'keyup'} );
        controls.add( "w",     this, function() { this.thrust[2] =  1; } );     controls.add( "w",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );
        controls.add( "a",     this, function() { this.thrust[0] =  1; } );     controls.add( "a",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'} );
        controls.add( "s",     this, function() { this.thrust[2] = -1; } );     controls.add( "s",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );
        controls.add( "d",     this, function() { this.thrust[0] = -1; } );     controls.add( "d",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'} );
        controls.add( ",",     this, function() { this.graphics_state.camera_transform = mult( rotation( 6, 0, 0,  1 ), this.graphics_state.camera_transform ); } );
        controls.add( ".",     this, function() { this.graphics_state.camera_transform = mult( rotation( 6, 0, 0, -1 ), this.graphics_state.camera_transform ); } );
        controls.add( "o",     this, function() { this.origin = mult_vec( inverse( this.graphics_state.camera_transform ), vec4(0,0,0,1) ).slice(0,3)         ; } );
        controls.add( "r",     this, function() { this.graphics_state.camera_transform = identity()                                                           ; } );
        controls.add( "f",     this, function() { this.looking  ^=  1; } );
      },
    'update_strings'( user_interface_string_manager )   // Strings that this Scene_Component contributes to the UI:
      { var C_inv = inverse( this.graphics_state.camera_transform ), pos = mult_vec( C_inv, vec4( 0, 0, 0, 1 ) ),
                                                                  z_axis = mult_vec( C_inv, vec4( 0, 0, 1, 0 ) );
        user_interface_string_manager.string_map["origin" ] = "Center of rotation: " 
                                                              + this.origin[0].toFixed(0) + ", " + this.origin[1].toFixed(0) + ", " + this.origin[2].toFixed(0);
        user_interface_string_manager.string_map["cam_pos"] = "Cam Position: "
                                                              + pos[0].toFixed(2) + ", " + pos[1].toFixed(2) + ", " + pos[2].toFixed(2);    
        user_interface_string_manager.string_map["facing" ] = "Facing: " + ( ( z_axis[0] > 0 ? "West " : "East ")             // (Actually affected by the left hand rule)
                                                               + ( z_axis[1] > 0 ? "Down " : "Up " ) + ( z_axis[2] > 0 ? "North" : "South" ) );
      },
    'display'( graphics_state )
      { var leeway = 70,  degrees_per_frame = .0004 * graphics_state.animation_delta_time,
                          meters_per_frame  =   .01 * graphics_state.animation_delta_time;
        if( this.mouse.anchor )                                                         // Third-person "arcball" camera mode: Is a mouse drag occurring?
        { var dragging_vector = subtract( this.mouse.from_center, this.mouse.anchor );  // Spin the scene around the world origin on a user-determined axis.
          if( length( dragging_vector ) > 0 )
            graphics_state.camera_transform = mult( graphics_state.camera_transform,    // Post-multiply so we rotate the scene instead of the camera.
                mult( translation( this.origin ),
                mult( rotation( .05 * length( dragging_vector ), dragging_vector[1], dragging_vector[0], 0 ),
                      translation(scale_vec( -1, this.origin ) ) ) ) );
        }
        // First-person flyaround mode:  Determine camera rotation movement when the mouse is past a minimum distance (leeway) from the canvas's center.
        var offsets = { plus:  [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ],
                        minus: [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ] };
        if( this.looking ) 
          for( var i = 0; i < 2; i++ )      // Steer according to "mouse_from_center" vector, but don't start increasing until outside a leeway window from the center.
          { var velocity = ( ( offsets.minus[i] > 0 && offsets.minus[i] ) || ( offsets.plus[i] < 0 && offsets.plus[i] ) ) * degrees_per_frame;  // &&'s might zero these out.
            graphics_state.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), graphics_state.camera_transform );   // On X step, rotate around Y axis, and vice versa.
          }     // Now apply translation movement of the camera, in the newest local coordinate frame
        graphics_state.camera_transform = mult( translation( scale_vec( meters_per_frame, this.thrust ) ), graphics_state.camera_transform );
      }
  }, Scene_Component );

Declare_Any_Class( "Flag_Toggler",  // A class that just interacts with the keyboard and reports strings
  { 'construct'( context ) { this.globals    = context.globals; },
    'init_keys'( controls )   //  Desired keyboard shortcuts
      { controls.add( "ALT+g", this, function() { this.globals.graphics_state.gouraud       ^= 1; } );   // Make the keyboard toggle some
        controls.add( "ALT+n", this, function() { this.globals.graphics_state.color_normals ^= 1; } );   // GPU flags on and off.
        controls.add( "ALT+a", this, function() { this.globals.animate                      ^= 1; } );
      },
    'update_strings'( user_interface_string_manager )   // Strings that this Scene_Component contributes to the UI:
      { user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( this.globals.graphics_state.animation_time )/1000 + "s";
        user_interface_string_manager.string_map["animate"] = "Animation " + (this.globals.animate ? "on" : "off") ;
      },
  }, Scene_Component );
  

  // DISCLAIMER:  The collision method shown below is not used by anyone; it's just very quick to code.  Making every collision body a stretched sphere is kind 
  // of a hack, and looping through a list of discrete sphere points to see if the volumes intersect is *really* a hack (there are perfectly good analytic 
  // expressions that can test if two ellipsoids intersect without discretizing them into points).   On the other hand, for non-convex shapes you're usually going
  // to have to loop through a list of discrete tetrahedrons defining the shape anyway.
Declare_Any_Class( "Body",
  { 'construct'(s, m) { this.randomize(s, m); },
    'randomize'(s, m)
      { this.define_data_members( { shape: s, scale: [1, 1+Math.random(), 1],
                                    location_matrix: mult( rotation( 360 * Math.random(), random_vec3(1) ), translation( random_vec3(10) ) ), 
                                    linear_velocity: random_vec3(.1), 
                                    angular_velocity: .5*Math.random(), spin_axis: random_vec3(1),
                                    material: m } )
      },
    'advance'( b, time_amount )   // Do one timestep.
      { var delta = translation( scale_vec( time_amount, b.linear_velocity ) );  // Move proportionally to real time.
        b.location_matrix = mult( delta, b.location_matrix );                    // Apply translation velocity - pre-multiply to keep translations together
        
        delta = rotation( time_amount * b.angular_velocity, b.spin_axis );       // Move proportionally to real time.
        b.location_matrix = mult( b.location_matrix, delta );                    // Apply angular velocity - post-multiply to keep rotations together    
      },
    'check_if_colliding'( b, a_inv, shape )   // Collision detection function
      { if ( this == b ) return false;        // Nothing collides with itself
        var T = mult( a_inv, mult( b.location_matrix, scale( b.scale ) ) );  // Convert sphere b to a coordinate frame where a is a unit sphere
        for( let p of shape.positions )                                      // For each vertex in that b,
        { var Tp = mult_vec( T, p.concat(1) ).slice(0,3);                    // Apply a_inv*b coordinate frame shift
          if( dot( Tp, Tp ) < 1.2 )   return true;     // Check if in that coordinate frame it penetrates the unit sphere at the origin.     
        }
        return false;
      }
  });
  
Declare_Any_Class( "Simulation_Scene_Superclass",
  { 'construct'( context )
      { context.globals.animate = true;
        this.define_data_members( { bodies: [], shader: context.shaders_in_use["Phong_Model"], stars: context.textures_in_use["stars.png"] } );
        
        var shapes = { "donut"       : new Torus( 15, 15 ),
                       "cone"        : new Closed_Cone( 10, 10 ),
                       "capped"      : new Capped_Cylinder( 4, 12 ),
                       "axis"        : new Axis_Arrows(),
                       "prism"       :     Capped_Cylinder   .prototype.auto_flat_shaded_version( 10, 10 ),
                       "gem"         :     Subdivision_Sphere.prototype.auto_flat_shaded_version( 2 ),
                       "gem2"        :     Torus             .prototype.auto_flat_shaded_version( 20, 20 ) };
        this.submit_shapes( context, shapes );
      },
    'random_shape'() { return Object.values( this.shapes )[ Math.floor( 7*Math.random() ) ] },
    'random_material'() { return this.shader.material( Color( 1,Math.random(),Math.random(),1 ), .1, 1, 1, 40, this.stars ) },
    'display'( graphics_state )
      { graphics_state.lights = [ new Light( vec4(5,1,1,0), Color( 1, 1, 1, 1 ), 10000 ) ];
                                              
        if( Math.random() < .02 ) this.bodies.splice( 0, this.bodies.length/4 ); // Sometimes we delete some so they can re-generate as new ones
        for( let b of this.bodies )
        { b.shape.draw( graphics_state, mult( b.location_matrix, scale( b.scale ) ), b.material ); // Draw each shape at its current location 
          b.advance( b, graphics_state.animation_delta_time );
        }
        this.simulate();    // This is an abstract class; call the subclass's version
      },
  }, Scene_Component );

Declare_Any_Class( "Ground_Collision_Scene",    // Scenario 1: Let random initial momentums carry bodies until they fall and bounce.
  { 'simulate'()
      { while( this.bodies.length < 100 )   this.bodies.push( new Body(this.random_shape(), this.random_material()) );      // Generate moving bodies  
        for( let b of this.bodies )
        { b.linear_velocity[1] += .0001 * -9.8;       // Gravity.
          if( b.location_matrix[1][3] < -4 && b.linear_velocity[1] < 0 ) b.linear_velocity[1] *= -.8;   // If about to fall through floor, reverse y velocity.     
        }
      }
  }, Simulation_Scene_Superclass );
 
Declare_Any_Class( "Object_Collision_Scene",    // Scenario 2: Detect when some flying objects collide with one another, coloring them red.    
  { 'simulate'()
      { if   ( this.bodies.length > 20 )       this.bodies = this.bodies.splice( 0, 20 );                                   // Max of 20 bodies
        while( this.bodies.length < 20 )       this.bodies.push( new Body(this.random_shape(), this.random_material()) );   // Generate moving bodies  
        
        if( ! this.collider ) this.collider = new Subdivision_Sphere(1);      // The collision shape should be simple
        
        for( let b of this.bodies )
        { var b_inv = inverse( mult( b.location_matrix, scale( b.scale ) ) );               // Cache b's final transform
          
          var center = mult_vec( b.location_matrix, vec4( 0, 0, 0, 1 ) ).slice(0,3);        // Center of the body
          b.linear_velocity = subtract( b.linear_velocity, scale_vec( .0003, center ) );    // Apply a small centripetal force to everything
          b.material = this.shader.material( Color( 1,1,1,1 ), .1, 1, 1, 40, this.stars );              // Default color: white
         
          for( let c of this.bodies )                                      // Collision process starts here
            if( b.check_if_colliding( c, b_inv, this.collider ) )          // Send the two bodies and the collision shape
            { b.material = this.shader.material( Color( 1,0,0,1 ), .1, 1, 1, 40, this.stars );        // If we get here, we collided, so turn red
              b.linear_velocity  = vec3();                                 // Zero out the velocity so they don't inter-penetrate more
              b.angular_velocity = 0;
            }   
        }   
      }
  }, Simulation_Scene_Superclass );