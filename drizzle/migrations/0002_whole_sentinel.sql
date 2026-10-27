ALTER TABLE "project_enquiries" ADD CONSTRAINT "project_enquiries_service_check" CHECK ("project_enquiries"."service" IN (
        'Bathroom tiling',
        'Kitchens & splashbacks',
        'Wall & floor tiling',
        'Something else'
      ));
